<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],


    'biinsphere' => [
        // Shared with Biinsphere (its LINKED_PLATFORMS_SECRETS entry for this platform).
        'secret' => env('BIINSPHERE_SSO_SECRET'),
        // The Biinsphere app; link tokens are only ever sent here.
        'frontend_url' => env('BIINSPHERE_FRONTEND_URL', 'http://localhost:5173'),
        // This platform's code on Biinsphere (Brevet Learning System = brevet_ls).
        'platform_code' => env('BIINSPHERE_PLATFORM_CODE', 'brevet_ls'),
    ],

];
