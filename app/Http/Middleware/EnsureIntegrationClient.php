<?php

namespace App\Http\Middleware;

use App\Models\IntegrationClient;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Token harus milik klien integrasi aktif dan punya ability yang diminta,
 * mis. `integration.client:enroll` atau `integration.client:agent:write`.
 */
class EnsureIntegrationClient
{
    public function handle(Request $request, Closure $next, string $ability): Response
    {
        $client = $request->user();

        if (!$client instanceof IntegrationClient) {
            return response()->json(['success' => false, 'message' => 'Token integrasi tidak valid.'], 401);
        }

        if (!$client->is_active) {
            return response()->json(['success' => false, 'message' => 'Klien integrasi nonaktif.'], 403);
        }

        if (!$client->tokenCan($ability)) {
            return response()->json(['success' => false, 'message' => "Token tidak punya izin {$ability}."], 403);
        }

        return $next($request);
    }
}
