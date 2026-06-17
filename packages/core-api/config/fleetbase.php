<?php

/**
 * -------------------------------------------
 * Fleetbase Core API Configuration
 * -------------------------------------------
 */

return [
    'api' => [
        'version' => 'v1',
        'routing' => [
            'prefix' => env('API_PREFIX'),
            'internal_prefix' => env('INTERNAL_API_PREFIX', 'int')
        ]
    ],
    'console' => [
        'path' => env('CONSOLE_PATH', env('FRONTEND_PATH', '/fleetbase/frontend')),
        'host' => env('CONSOLE_HOST', env('FRONTEND_HOST', 'localhost')),
        'subdomain' => env('CONSOLE_SUBDOMAIN'),
        'secure' => env('CONSOLE_SECURE', !app()->environment(['development', 'local']))
    ],
    'services' => [
        'ipinfo' => [
            'api_key' => env('IPINFO_API_KEY')
        ]
    ],
    'installer' => [
        // SaaS default: installer UI and runtime schema changes are disabled unless explicitly enabled.
        'ui_enabled' => env('INSTALLER_UI_ENABLED', false),
        'runtime_setup_enabled' => env('INSTALLER_RUNTIME_SETUP_ENABLED', false),
    ],
    'mailboxes' => [
        'default' => env('MAIL_DEFAULT_MAILBOX', 'support'),
        'addresses' => [
            'sales' => env('MAIL_SALES_ADDRESS', 'sales@shipgen.net'),
            'support' => env('MAIL_SUPPORT_ADDRESS', 'support@shipgen.net'),
            'noreply' => env('MAIL_NOREPLY_ADDRESS', 'noreply@shipgen.net'),
            'billing' => env('MAIL_BILLING_ADDRESS', 'billing@shipgen.net'),
        ],
        'reply_enabled_mailboxes' => ['sales', 'support', 'billing'],
        'no_reply_exact' => [
            'auth.verification',
            'auth.verification-2fa',
            'auth.password-reset',
            'auth.user-credentials',
            'registry.developer-verification',
            'storefront.verification-create-customer',
            'storefront.verification-account-closure',
            'fleetops.customer-credentials',
        ],
        'mapping' => [
            'exact' => [
                'auth.user-invited' => 'sales',
                'storefront.network-invite' => 'sales',
            ],
            'prefix' => [
                // Customer-facing support communications.
                'support.' => 'support',
                // System-generated authentication and operational notifications.
                'auth.' => 'noreply',
                'fleetops.' => 'noreply',
                'storefront.order-' => 'noreply',
                'storefront.verification-' => 'noreply',
                'registry.' => 'noreply',
                // Finance and payment communications.
                'ledger.' => 'billing',
                'billing.' => 'billing',
                'invoice.' => 'billing',
            ],
        ],
    ],
    'connection' => [
        'db' => env('DB_CONNECTION', 'mysql'),
        'sandbox' => env('SANDBOX_DB_CONNECTION', 'sandbox')
    ],
    'assets' => [
        'public_base_url' => env('ASSET_PUBLIC_BASE_URL', env('APP_URL', 'http://localhost:8000')),
        's3_bucket'       => env('FLEETBASE_ASSETS_S3_BUCKET', ''),
    ],

    'branding' => [
        // Use a full https:// URL in production so Gmail/Outlook can load the logo.
        'logo_url' => env('BRANDING_LOGO_URL', '/images/logo_logistic.png'),
        'icon_url' => env('BRANDING_ICON_URL', '/images/logo_logistic.png'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Default placeholder images (served from api/public/defaults or your CDN)
    |--------------------------------------------------------------------------
    */
    'defaults' => [
        'user_image'         => env('DEFAULT_USER_IMAGE', '/defaults/no-avatar.svg'),
        'driver_image'       => env('DEFAULT_DRIVER_IMAGE', '/defaults/no-avatar.svg'),
        'contact_image'      => env('DEFAULT_CONTACT_IMAGE', '/defaults/no-avatar.svg'),
        'vendor_image'       => env('DEFAULT_VENDOR_IMAGE', '/defaults/no-avatar.svg'),
        'vehicle_image'      => env('DEFAULT_VEHICLE_IMAGE', '/defaults/vehicle.svg'),
        'entity_image'       => env('DEFAULT_ENTITY_IMAGE', '/defaults/parcel.svg'),
        'category_image'     => env('DEFAULT_CATEGORY_IMAGE', '/defaults/placeholder.svg'),
        'placeholder_image'  => env('DEFAULT_PLACEHOLDER_IMAGE', '/defaults/placeholder.svg'),
        'company_logo'       => env('DEFAULT_COMPANY_LOGO', '/defaults/placeholder.svg'),
        'company_backdrop'   => env('DEFAULT_COMPANY_BACKDROP', '/defaults/placeholder.svg'),
        'extension_icon'     => env('DEFAULT_EXTENSION_ICON', '/defaults/extension.svg'),
        'store_logo'         => env('DEFAULT_STORE_LOGO', '/defaults/placeholder.svg'),
        'store_backdrop'     => env('DEFAULT_STORE_BACKDROP', '/defaults/placeholder.svg'),
        'device_image'       => env('DEFAULT_DEVICE_IMAGE', '/defaults/placeholder.svg'),
        'vehicle_avatar'     => env('DEFAULT_VEHICLE_AVATAR', '/defaults/vehicle.svg'),
        'driver_avatar'      => env('DEFAULT_DRIVER_AVATAR', '/defaults/no-avatar.svg'),
        'place_avatar'       => env('DEFAULT_PLACE_AVATAR', '/defaults/place.svg'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Map tiles (Leaflet basemap — self-host via MAP_TILE_URL, not fleetbase.io)
    |--------------------------------------------------------------------------
    */
    'maps' => [
        'tile_url'        => env('MAP_TILE_URL', 'http://localhost:8080/styles/basic/{z}/{x}/{y}.png'),
        'tile_url_dark'   => env('MAP_TILE_URL_DARK', env('MAP_TILE_URL', 'http://localhost:8080/styles/basic/{z}/{x}/{y}.png')),
        'attribution'     => env('MAP_TILE_ATTRIBUTION', '© OpenStreetMap contributors'),
        'subdomains'      => env('MAP_TILE_SUBDOMAINS', ''),
        'max_zoom'        => (int) env('MAP_TILE_MAX_ZOOM', 19),
    ],
    'version' => env('FLEETBASE_VERSION', '0.7.1'),
    'instance_id' => env('FLEETBASE_INSTANCE_ID') ?? (file_exists(base_path('.fleetbase-id')) ? trim(file_get_contents(base_path('.fleetbase-id'))) : null),

    /*
     |--------------------------------------------------------------------------
     | SMS Authentication Bypass Code
     |--------------------------------------------------------------------------
     |
     | This value allows a configurable bypass code for SMS-based authentication,
     | intended strictly for testing and development environments. It MUST be
     | left null (unset) in production. When null or empty, no bypass is
     | permitted and only the genuine Redis-stored OTP will be accepted.
     |
     | Environment variable: SMS_AUTH_BYPASS_CODE
     |
     */
    'sms_auth_bypass_code' => env('SMS_AUTH_BYPASS_CODE'),

    'user_cache' => [
        'enabled' => env('USER_CACHE_ENABLED', true),
        'server_ttl' => (int) env('USER_CACHE_SERVER_TTL', 900), // 15 minutes
        'browser_ttl' => (int) env('USER_CACHE_BROWSER_TTL', 300), // 5 minutes
    ],

    /*
    |--------------------------------------------------------------------------
    | API gateway (microservices — session at edge, JWT between services)
    |--------------------------------------------------------------------------
    */
    'gateway' => [
        'internal_secret'     => env('GATEWAY_INTERNAL_SECRET'),
        'jwt_secret'          => env('GATEWAY_JWT_SECRET', env('APP_KEY')),
        'jwt_issuer'          => env('GATEWAY_JWT_ISSUER', 'shipgen-iam'),
        'jwt_audience'        => env('GATEWAY_JWT_AUDIENCE', 'shipgen-internal'),
        'jwt_ttl'             => (int) env('GATEWAY_JWT_TTL', 900),
        'trust_internal_jwt'  => filter_var(env('GATEWAY_TRUST_INTERNAL_JWT', false), FILTER_VALIDATE_BOOLEAN),
    ],
];
