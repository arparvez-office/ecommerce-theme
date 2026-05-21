<?php


/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'u349399756_h8TIm' );

/** Database username */
define( 'DB_USER', 'u349399756_KEuZ2' );

/** Database password */
define( 'DB_PASSWORD', 'gcAXPgEecf' );

/** Database hostname */
define( 'DB_HOST', '127.0.0.1' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          '}>4O:JeAxF$R/)J-#I3U/YFjb);(m?5csjp+E$7y4}BCDqr@<<e.}?=G@0oDA4d1' );
define( 'SECURE_AUTH_KEY',   'jI9]8SXt4{=$ZA]bFnz?E 1k/JL3=#a@g-4_c=?h@J=-GH$7z3b(Bfr}dbpMXC[r' );
define( 'LOGGED_IN_KEY',     '=c`h#j/XXcFIgp=@UIYiz]$}ab7[/WC!<XM&T~u=FnR0iA+e-D:HhJ~8inbn!9V<' );
define( 'NONCE_KEY',         'K/g~ 3H]#+3UP%B}%hU46: V~~?c#>h5_Fhrs~U~y7E?W(G}D[8oc*YyL?`[FhN&' );
define( 'AUTH_SALT',         'Vx^zv;*#1DWMB-N:kKX*[NV5M!BC9$svcZj7azv gm+47>Q.qe ]JP=qbjF5D/M7' );
define( 'SECURE_AUTH_SALT',  'ME5juCu%}F.Z +<*nVEy[m>p-u>@N00j,Eg8TU5tZ#hq-%i7TKd|7F_sIsR:AUvN' );
define( 'LOGGED_IN_SALT',    'C#,Ih?G#Q+%+;Na[@V=HDVTu6WvN+f#[1R)/Dowo~Rn6(O3RAg_@L9fNoK!.vN<(' );
define( 'NONCE_SALT',        '<%dBz=8R`(Ah,>z,h%Tq?}z#J &E{:&P=ZG`ppOc+)B&Hm9|PUza3q/URxv`g<O`' );
define( 'WP_CACHE_KEY_SALT', 'J^6Q{ ^#ww?>.@f@XXKeA.%HKToD??%.^Tg&jW}v_l7bE4QB9^DF|iDIxBSp5Ag=' );


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';


/* Add any custom values between this line and the "stop editing" line. */



/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', false );
}

define( 'FS_METHOD', 'direct' );
define( 'COOKIEHASH', 'b2eeb7755bd18fea0da41fe699778fe9' );
define( 'WP_AUTO_UPDATE_CORE', 'minor' );
/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
