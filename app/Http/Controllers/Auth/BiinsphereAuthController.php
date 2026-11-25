<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\BiinsphereToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

/**
 * Connecting this platform to Biinsphere (Biinsphere AGENTS §14).
 *
 * - A connection always starts on Biinsphere, which sends a one-time `state`.
 *   The signed `link` token carries that state, so it can only connect the
 *   Biinsphere account that asked for it.
 * - Tokens go only to the configured Biinsphere URL (BIINSPHERE_FRONTEND_URL),
 *   never to an address taken from the request.
 * - A `launch` token from Biinsphere works once, for this platform only.
 * - This platform remembers which Biinsphere account each user connected
 *   (biinsphere_user_id, biinsphere_username, biinsphere_linked_at; never the
 *   Biinsphere email), one to one in both directions.
 */
class BiinsphereAuthController extends Controller
{
    private const STATE_RULE = '/^[A-Za-z0-9_-]{16,128}$/';

    private const INVALID_LINK = 'Link Biinsphere tidak valid atau sudah kedaluwarsa. Silakan mulai lagi dari Biinsphere.';

    /**
     * Show the prompt to connect this account to Biinsphere.
     */
    public function showAuthorizeForm(Request $request)
    {
        $state = (string) $request->query('state', '');
        abort_unless(preg_match(self::STATE_RULE, $state) === 1, 400, self::INVALID_LINK);

        $user = Auth::user();
        $role = null;
        if ($user && method_exists($user, 'getRoleNames')) {
            $role = $user->getRoleNames()->first();
        }
        if (! $role && $user) {
            $role = $user->role ?? 'User';
        }

        $response = Inertia::render('Auth/BiinsphereAuthorize', [
            'user' => [
                'id' => $user?->id,
                'name' => $user?->name,
                'email' => $user?->email,
                'role' => $role ?? 'User',
            ],
            'state' => $state,
            // Already connected: the page says so instead of asking again.
            'connected_to' => self::connectedTo($user),
        ])->toResponse($request);

        // The prompt can't be shown inside another site's frame (no tricked clicks).
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Content-Security-Policy', "frame-ancestors 'none'");

        return $response;
    }

    /**
     * Sign a link token for the signed-in user and hand it to Biinsphere.
     */
    public function authorizeAccount(Request $request)
    {
        $validated = $request->validate([
            'state' => ['required', 'string', 'regex:'.self::STATE_RULE],
        ]);
        $user = Auth::user();

        // An account connected to a Biinsphere account can't be connected again.
        if (self::connectedTo($user) !== null) {
            return redirect()->route('biinsphere.authorize', ['state' => $validated['state']]);
        }

        $token = BiinsphereToken::sign('link', [
            'state' => $validated['state'],
            'external_user_id' => (string) $user->id,
            'external_email' => (string) $user->email,
            'external_username' => (string) ($user->name ?? ''),
            'display_name' => (string) ($user->name ?? ''),
        ]);

        return Inertia::render('Auth/BiinsphereCallback', [
            'token' => $token,
            'platform_code' => BiinsphereToken::platform(),
            'biinsphere_url' => rtrim((string) config('services.biinsphere.frontend_url'), '/'),
            'user' => [
                'id' => $user?->id,
                'name' => $user?->name,
                'email' => $user?->email,
            ],
        ]);
    }

    /**
     * Open this platform signed in from a Biinsphere launch token.
     */
    public function consumeLaunchToken(Request $request)
    {
        $refuse = fn () => redirect()->route('login')->with('status', self::INVALID_LINK);

        $claims = BiinsphereToken::verify((string) $request->query('token', ''), 'launch');
        if (! $claims) {
            return $refuse();
        }

        if (! self::useOnce($claims)) {
            return $refuse();
        }

        // Only the connected account itself, never a lookup by email.
        $externalUserId = $claims['external_user_id'] ?? null;
        $user = is_string($externalUserId) && $externalUserId !== '' ? User::find($externalUserId) : null;
        if (! $user) {
            return $refuse();
        }

        // Remember (or refresh) who is connected; a link made before this
        // existed is filled in on its first launch. A user connected to another
        // Biinsphere account is refused (one to one).
        $updates = ['last_login_at' => now()];
        $biinsphereUserId = $claims['biinsphere_user_id'] ?? null;
        if (self::linkColumnsExist() && is_string($biinsphereUserId) && $biinsphereUserId !== '') {
            if ($user->biinsphere_user_id && $user->biinsphere_user_id !== $biinsphereUserId) {
                return $refuse();
            }
            if (! $user->biinsphere_user_id && self::biinsphereIdTakenByOther($biinsphereUserId, $user)) {
                return $refuse();
            }
            $updates['biinsphere_user_id'] = $biinsphereUserId;
            $updates['biinsphere_username'] = self::username($claims);
            $updates['biinsphere_linked_at'] = $user->biinsphere_linked_at ?? now();
        }

        Auth::login($user);
        $request->session()->regenerate();

        $user->timestamps = false;
        $user->forceFill($updates)->save();

        // Same landing page as a normal Brevet Learning System login.
        if ($user->role === 'admin') {
            return redirect()->route('admin.dashboard');
        }
        if ($user->role === 'pengajar') {
            return redirect()->route('teacher.dashboard');
        }

        return redirect()->route('dashboard');
    }

    /**
     * Biinsphere asks to remember a new link before it saves its own side
     * (POST /api/biinsphere/link, Bearer `link_confirm` token). Answering the
     * same link again is fine; a user already connected to another Biinsphere
     * account, or a Biinsphere account already connected to another user, is 409.
     */
    public function confirmLink(Request $request)
    {
        if (! self::linkColumnsExist()) {
            return response()->json(['message' => 'Not available yet.'], 503);
        }
        $claims = BiinsphereToken::verify((string) $request->bearerToken(), 'link_confirm');
        if (! $claims || ! self::useOnce($claims)) {
            return response()->json(['message' => 'Invalid token.'], 401);
        }
        $externalUserId = $claims['external_user_id'] ?? null;
        $biinsphereUserId = $claims['biinsphere_user_id'] ?? null;
        if (! is_string($externalUserId) || $externalUserId === '' || ! is_string($biinsphereUserId) || $biinsphereUserId === '') {
            return response()->json(['message' => 'Invalid token.'], 400);
        }

        return DB::transaction(function () use ($externalUserId, $biinsphereUserId, $claims) {
            $user = User::whereKey($externalUserId)->lockForUpdate()->first();
            if (! $user) {
                return response()->json(['message' => 'User not found.'], 404);
            }
            if ($user->biinsphere_user_id && $user->biinsphere_user_id !== $biinsphereUserId) {
                // Says which Biinsphere account holds it, so Biinsphere can clear
                // a link left by an account it already deleted for good.
                return response()->json([
                    'message' => 'Already connected to another account.',
                    'biinsphere_user_id' => $user->biinsphere_user_id,
                ], 409);
            }
            if (self::biinsphereIdTakenByOther($biinsphereUserId, $user)) {
                return response()->json(['message' => 'Already connected to another account.'], 409);
            }

            $user->timestamps = false;
            $user->forceFill([
                'biinsphere_user_id' => $biinsphereUserId,
                'biinsphere_username' => self::username($claims),
                'biinsphere_linked_at' => $user->biinsphere_linked_at ?? now(),
            ])->save();

            return response()->json(['success' => true]);
        });
    }

    /**
     * Biinsphere says a link is gone, e.g. its account was deleted for good
     * (POST /api/biinsphere/unlink, Bearer `unlink` token). Clears the columns
     * only when they still point at that Biinsphere account; answering again
     * is fine.
     */
    public function unlink(Request $request)
    {
        if (! self::linkColumnsExist()) {
            return response()->json(['message' => 'Not available yet.'], 503);
        }
        $claims = BiinsphereToken::verify((string) $request->bearerToken(), 'unlink');
        if (! $claims || ! self::useOnce($claims)) {
            return response()->json(['message' => 'Invalid token.'], 401);
        }
        $externalUserId = $claims['external_user_id'] ?? null;
        $biinsphereUserId = $claims['biinsphere_user_id'] ?? null;
        if (! is_string($externalUserId) || $externalUserId === '' || ! is_string($biinsphereUserId) || $biinsphereUserId === '') {
            return response()->json(['message' => 'Invalid token.'], 400);
        }

        User::whereKey($externalUserId)
            ->where('biinsphere_user_id', $biinsphereUserId)
            ->toBase()
            ->update(['biinsphere_user_id' => null, 'biinsphere_username' => null, 'biinsphere_linked_at' => null]);

        return response()->json(['success' => true]);
    }

    /** Single use: remember the token's jti until it could no longer be valid. */
    private static function useOnce(array $claims): bool
    {
        $ttl = max(1, $claims['exp'] - time()) + 30;

        return Cache::add('biinsphere_token:'.$claims['typ'].':'.$claims['jti'], true, now()->addSeconds($ttl));
    }

    /** Before the migration runs, links simply aren't remembered on this side. */
    private static function linkColumnsExist(): bool
    {
        static $exists = null;

        return $exists ??= Schema::hasColumn('users', 'biinsphere_user_id');
    }

    /** The Biinsphere account this user is connected to, or null. */
    private static function connectedTo(?User $user): ?array
    {
        if (! $user || ! self::linkColumnsExist() || ! $user->biinsphere_user_id) {
            return null;
        }

        return ['username' => $user->biinsphere_username];
    }

    private static function biinsphereIdTakenByOther(string $biinsphereUserId, User $user): bool
    {
        return User::where('biinsphere_user_id', $biinsphereUserId)->whereKeyNot($user->getKey())->exists();
    }

    private static function username(array $claims): ?string
    {
        $name = $claims['biinsphere_username'] ?? null;

        return is_string($name) && $name !== '' ? mb_substr($name, 0, 100) : null;
    }
}
