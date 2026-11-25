<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Tokens exchanged with Biinsphere. Every token says what it is for (typ), who
 * sent it (iss), who it is for (aud), when it was made (iat), when it expires
 * (exp) and carries a unique id (jti), so a token made for one step can never
 * be used for another. Same contract as Biinsphere's internal/auth/platform_tokens.go.
 */
final class BiinsphereToken
{
    public const BIINSPHERE = 'biinsphere';

    /** Absorbs small clock differences between servers. */
    private const LEEWAY = 30;

    /** Longest allowed life (exp - iat) per kind of token, in seconds. */
    private const MAX_LIFE = [
        'link' => 300,
        'login' => 300,
        'launch' => 60,
        'link_confirm' => 60,
        'unlink' => 60,
    ];

    /** This platform's code on Biinsphere (iss of tokens it signs, aud of tokens it receives). */
    public static function platform(): string
    {
        return (string) config('services.biinsphere.platform_code', 'brevet_ls');
    }

    /** Sign a token of this kind from this platform to Biinsphere. */
    public static function sign(string $type, array $claims): string
    {
        if (! isset(self::MAX_LIFE[$type])) {
            throw new \InvalidArgumentException("Unknown Biinsphere token type {$type}");
        }
        $secret = self::secret();
        if ($secret === '') {
            throw new \RuntimeException('BIINSPHERE_SSO_SECRET is not set');
        }

        $now = time();
        $payload = array_merge($claims, [
            'typ' => $type,
            'iss' => self::platform(),
            'aud' => self::BIINSPHERE,
            'jti' => (string) Str::uuid(),
            'iat' => $now,
            'exp' => $now + self::MAX_LIFE[$type],
        ]);

        $header = self::encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $body = self::encode(json_encode($payload));
        $signature = self::encode(hash_hmac('sha256', "{$header}.{$body}", $secret, true));

        return "{$header}.{$body}.{$signature}";
    }

    /**
     * Claims of a valid token of this kind sent by Biinsphere to this platform,
     * or null for anything else (wrong kind, sender, receiver, signature,
     * missing jti/iat/exp, expired, or living longer than its kind allows).
     */
    public static function verify(string $token, string $type): ?array
    {
        $secret = self::secret();
        if ($secret === '' || ! isset(self::MAX_LIFE[$type])) {
            return null;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$header, $body, $signature] = $parts;

        $head = json_decode(self::decode($header), true);
        if (! is_array($head) || ($head['alg'] ?? null) !== 'HS256') {
            return null;
        }
        $expected = self::encode(hash_hmac('sha256', "{$header}.{$body}", $secret, true));
        if (! hash_equals($expected, $signature)) {
            return null;
        }

        $claims = json_decode(self::decode($body), true);
        if (! is_array($claims)) {
            return null;
        }

        $aud = $claims['aud'] ?? null;
        $forThisPlatform = $aud === self::platform() || (is_array($aud) && in_array(self::platform(), $aud, true));
        if (($claims['typ'] ?? null) !== $type || ($claims['iss'] ?? null) !== self::BIINSPHERE || ! $forThisPlatform) {
            return null;
        }
        if (! is_string($claims['jti'] ?? null) || $claims['jti'] === '') {
            return null;
        }

        $iat = $claims['iat'] ?? null;
        $exp = $claims['exp'] ?? null;
        if (! is_int($iat) || ! is_int($exp)) {
            return null;
        }
        $now = time();
        if ($iat > $now + self::LEEWAY || $exp < $now - self::LEEWAY || $exp - $iat > self::MAX_LIFE[$type]) {
            return null;
        }

        return $claims;
    }

    private static function secret(): string
    {
        return (string) config('services.biinsphere.secret');
    }

    private static function encode(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    private static function decode(string $part): string
    {
        return (string) base64_decode(strtr($part, '-_', '+/'));
    }
}
