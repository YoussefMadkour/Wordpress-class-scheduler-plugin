<?php
/**
 * Plugin Name: Class Schedule
 * Description: Dynamic weekly class schedule with admin CRUD and shortcode/block renderer.
 * Version: 0.2.1
 * Author: ZakFit
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: class-schedule
 */

if (!defined('ABSPATH')) {
	exit;
}

define('CLASS_SCHEDULE_VERSION', '0.2.1');
define('CLASS_SCHEDULE_PLUGIN_FILE', __FILE__);
define('CLASS_SCHEDULE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CLASS_SCHEDULE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CLASS_SCHEDULE_OPTION_KEY', 'class_schedule_data');

// Activation: ensure options exist
register_activation_hook(__FILE__, function () {
	if (get_option(CLASS_SCHEDULE_OPTION_KEY) === false) {
		update_option(CLASS_SCHEDULE_OPTION_KEY, wp_json_encode([]));
	}
	if (get_option('class_schedule_locations') === false) {
		$default_locations = [
			['id' => 'zayed-dunes', 'name' => 'EDGEFIT (zayed-dunes)', 'slug' => 'zayed-dunes'],
			['id' => 'wcc-beverly-hills', 'name' => 'CORE (wcc--beverly-hills)', 'slug' => 'wcc-beverly-hills']
		];
		update_option('class_schedule_locations', wp_json_encode($default_locations));
	}
});

// Admin menu and page
add_action('admin_menu', function () {
	add_menu_page(
		__('Class Schedule', 'class-schedule'),
		__('Class Schedule', 'class-schedule'),
		'manage_options',
		'class-schedule',
		'class_schedule_render_admin_page',
		'dashicons-calendar-alt'
	);
});

function class_schedule_render_admin_page()
{
	if (!current_user_can('manage_options')) {
		return;
	}
	// Root div for React admin app (CRUD). Assets enqueued below on admin_enqueue_scripts
	echo '<div class="wrap"><h1>' . esc_html__('Class Schedule', 'class-schedule') . '</h1>';
	echo '<div id="class-schedule-admin-app"></div></div>';
}

// Enqueue admin assets (placeholder, wired later to built bundle)
add_action('admin_enqueue_scripts', function ($hook) {
	if ($hook !== 'toplevel_page_class-schedule') {
		return;
	}
	// Cache-bust using file modification time
	$admin_css_path = CLASS_SCHEDULE_PLUGIN_DIR . 'build/admin.css';
	$admin_js_path  = CLASS_SCHEDULE_PLUGIN_DIR . 'build/admin.js';
	$admin_css_ver  = file_exists($admin_css_path) ? filemtime($admin_css_path) : CLASS_SCHEDULE_VERSION;
	$admin_js_ver   = file_exists($admin_js_path) ? filemtime($admin_js_path) : CLASS_SCHEDULE_VERSION;

	wp_enqueue_style('class-schedule-admin', CLASS_SCHEDULE_PLUGIN_URL . 'build/admin.css', ['wp-components'], $admin_css_ver);
	wp_enqueue_script('class-schedule-admin', CLASS_SCHEDULE_PLUGIN_URL . 'build/admin.js', ['wp-element', 'wp-components', 'wp-i18n', 'wp-api-fetch'], $admin_js_ver, true);
	wp_localize_script('class-schedule-admin', 'CLASS_SCHEDULE_CONFIG', [
		'root' => esc_url_raw(rest_url('class-schedule/v1/')),
		'nonce' => wp_create_nonce('wp_rest'),
	]);
});

// Public enqueue
add_action('wp_enqueue_scripts', function () {
	// Cache-bust using file modification time
	$public_css_path = CLASS_SCHEDULE_PLUGIN_DIR . 'build/public.css';
	$public_js_path  = CLASS_SCHEDULE_PLUGIN_DIR . 'build/public.js';
	$public_css_ver  = file_exists($public_css_path) ? filemtime($public_css_path) : CLASS_SCHEDULE_VERSION;
	$public_js_ver   = file_exists($public_js_path) ? filemtime($public_js_path) : CLASS_SCHEDULE_VERSION;

	wp_enqueue_style('class-schedule-public', CLASS_SCHEDULE_PLUGIN_URL . 'build/public.css', [], $public_css_ver);
	wp_enqueue_script('class-schedule-public', CLASS_SCHEDULE_PLUGIN_URL . 'build/public.js', [], $public_js_ver, true);
	wp_localize_script('class-schedule-public', 'CLASS_SCHEDULE_CONFIG', [
		'root' => '/?rest_route=/class-schedule/v1/',
	]);
});

// REST API routes
add_action('rest_api_init', function () {
	// Schedule endpoint
	register_rest_route('class-schedule/v1', '/schedule', [
		[
			'methods' => 'GET',
			'permission_callback' => '__return_true',
			'callback' => function (WP_REST_Request $request) {
				$location = $request->get_param('location');
				$data = get_option(CLASS_SCHEDULE_OPTION_KEY, wp_json_encode([]));
				$schedule = json_decode($data, true);
				if (!is_array($schedule)) {
					$schedule = [];
				}
				// Filter by location if specified
				if ($location) {
					$schedule = array_filter($schedule, function($item) use ($location) {
						return isset($item['location']) && $item['location'] === $location;
					});
				}
				return rest_ensure_response(array_values($schedule));
			},
		],
		[
			'methods' => 'POST',
			'permission_callback' => function () {
				return current_user_can('manage_options');
			},
			'callback' => function (WP_REST_Request $request) {
				$body = $request->get_body();
				$items = json_decode($body, true);
				if (!is_array($items)) {
					return new WP_Error('invalid_data', __('Invalid schedule payload', 'class-schedule'), ['status' => 400]);
				}
				update_option(CLASS_SCHEDULE_OPTION_KEY, wp_json_encode($items));
				return rest_ensure_response(['success' => true]);
			},
		],
	]);

	// Locations endpoint
	register_rest_route('class-schedule/v1', '/locations', [
		[
			'methods' => 'GET',
			'permission_callback' => '__return_true',
			'callback' => function () {
				$data = get_option('class_schedule_locations', wp_json_encode([]));
				$locations = json_decode($data, true);
				if (!is_array($locations)) {
					$locations = [];
				}
				return rest_ensure_response($locations);
			},
		],
		[
			'methods' => 'POST',
			'permission_callback' => function () {
				return current_user_can('manage_options');
			},
			'callback' => function (WP_REST_Request $request) {
				$body = $request->get_body();
				$locations = json_decode($body, true);
				if (!is_array($locations)) {
					return new WP_Error('invalid_data', __('Invalid locations payload', 'class-schedule'), ['status' => 400]);
				}
				update_option('class_schedule_locations', wp_json_encode($locations));
				return rest_ensure_response(['success' => true]);
			},
		],
	]);
});

// Shortcode
add_shortcode('class_schedule', function ($atts) {
	$atts = shortcode_atts([], $atts, 'class_schedule');
	$container_id = 'class-schedule-frontend-' . wp_generate_uuid4();
	ob_start();
	?>
	<div class="class-schedule-wrapper">
		<div class="class-schedule-header">
			<div class="subtitle"><?php echo esc_html__('Class Schedule', 'class-schedule'); ?></div>
			<h2 class="title"><?php echo esc_html__('WORKING SCHEDULE', 'class-schedule'); ?></h2>
		</div>
		<div id="<?php echo esc_attr($container_id); ?>" class="class-schedule-grid" data-mount="react"></div>
	</div>
	<script type="text/javascript">
		window.ClassScheduleMounts = window.ClassScheduleMounts || [];
		window.ClassScheduleMounts.push('<?php echo esc_js($container_id); ?>');
	</script>
	<?php
	return ob_get_clean();
});

// Gutenberg block: enqueue editor assets (placeholder)
add_action('enqueue_block_editor_assets', function () {
	wp_enqueue_script('class-schedule-block', CLASS_SCHEDULE_PLUGIN_URL . 'build/block.js', ['wp-blocks', 'wp-element', 'wp-editor'], CLASS_SCHEDULE_VERSION, true);
	wp_enqueue_style('class-schedule-block', CLASS_SCHEDULE_PLUGIN_URL . 'build/block.css', [], CLASS_SCHEDULE_VERSION);
});

// Register dynamic block so frontend renders via shortcode
add_action('init', function () {
	if (function_exists('register_block_type')) {
		register_block_type('class-schedule/schedule', [
			'render_callback' => function () {
				return do_shortcode('[class_schedule]');
			},
		]);
	}
});


