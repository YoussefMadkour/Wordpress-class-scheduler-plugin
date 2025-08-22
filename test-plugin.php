<?php
/**
 * Quick test script to verify plugin syntax
 * Run: php test-plugin.php
 */

// Mock WordPress functions for syntax checking
if (!function_exists('add_action')) {
    function add_action($hook, $callback) { echo "✓ Hook: $hook registered\n"; }
    function add_shortcode($tag, $callback) { echo "✓ Shortcode: [$tag] registered\n"; }
    function register_activation_hook($file, $callback) { echo "✓ Activation hook registered\n"; }
    function register_rest_route($namespace, $route, $args) { echo "✓ REST route: $namespace$route registered\n"; }
    function plugin_dir_path($file) { return dirname($file) . '/'; }
    function plugin_dir_url($file) { return 'http://localhost/'; }
    function wp_json_encode($data) { return json_encode($data); }
    function get_option($key, $default = false) { return $default; }
    function update_option($key, $value) { return true; }
    function current_user_can($cap) { return true; }
    function wp_create_nonce($action) { return 'test-nonce'; }
    function rest_url($path) { return "http://localhost/wp-json/$path"; }
    function esc_url_raw($url) { return $url; }
    function esc_html__($text, $domain = '') { return $text; }
    function esc_attr($text) { return $text; }
    function esc_js($text) { return $text; }
    function wp_generate_uuid4() { return 'test-uuid'; }
    function shortcode_atts($defaults, $atts, $shortcode) { return $defaults; }
    function rest_ensure_response($data) { return $data; }
    function wp_enqueue_style($handle, $src, $deps = [], $ver = false) { echo "✓ Style enqueued: $handle\n"; }
    function wp_enqueue_script($handle, $src, $deps = [], $ver = false, $footer = false) { echo "✓ Script enqueued: $handle\n"; }
    function wp_localize_script($handle, $name, $data) { echo "✓ Script localized: $handle -> $name\n"; }
    function register_block_type($name, $args) { echo "✓ Block registered: $name\n"; }
    function do_shortcode($content) { return $content; }
    function function_exists($name) { return true; }
    class WP_REST_Request { function get_json_params() { return []; } }
    class WP_Error { function __construct($code, $message, $data = []) {} }
}

define('ABSPATH', true);

echo "Testing Class Schedule Plugin...\n\n";

// Include the plugin file
include 'wp-content/plugins/class-schedule/class-schedule.php';

echo "\n✅ Plugin loaded successfully! No syntax errors.\n";
echo "\nNext steps:\n";
echo "1. Run: docker-compose up -d\n";
echo "2. Visit: http://localhost:8080\n";
echo "3. Setup WordPress and activate the plugin\n";
