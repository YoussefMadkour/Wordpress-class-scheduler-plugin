<?php
/**
 * Debug script to check current class schedule data
 * Run this from WordPress admin or via WP-CLI to see the current state
 */

// Load WordPress
require_once('wp-config.php');

echo "=== CLASS SCHEDULE DEBUG ===\n\n";

// Get current locations
$locations_data = get_option('class_schedule_locations', '[]');
$locations = json_decode($locations_data, true);

echo "LOCATIONS:\n";
echo "Raw data: " . $locations_data . "\n";
echo "Parsed locations:\n";
if (is_array($locations)) {
    foreach ($locations as $location) {
        echo "  - ID: {$location['id']}, Name: {$location['name']}, Slug: {$location['slug']}\n";
    }
} else {
    echo "  ERROR: Locations data is not an array\n";
}

echo "\n";

// Get current schedule
$schedule_data = get_option('class_schedule_data', '[]');
$schedule = json_decode($schedule_data, true);

echo "SCHEDULE:\n";
echo "Raw data: " . $schedule_data . "\n";
echo "Parsed schedule:\n";
if (is_array($schedule)) {
    echo "Total classes: " . count($schedule) . "\n";
    foreach ($schedule as $class) {
        echo "  - {$class['title']} ({$class['day']}) at {$class['start']}-{$class['end']}";
        if (isset($class['location'])) {
            echo " | Location: {$class['location']}";
        } else {
            echo " | Location: NOT SET";
        }
        echo "\n";
    }
    
    // Group by location
    echo "\nCLASSES BY LOCATION:\n";
    $by_location = [];
    foreach ($schedule as $class) {
        $loc = isset($class['location']) ? $class['location'] : 'NO_LOCATION';
        if (!isset($by_location[$loc])) {
            $by_location[$loc] = [];
        }
        $by_location[$loc][] = $class;
    }
    
    foreach ($by_location as $loc => $classes) {
        echo "  Location '{$loc}': " . count($classes) . " classes\n";
    }
} else {
    echo "  ERROR: Schedule data is not an array\n";
}

echo "\n=== END DEBUG ===\n";
?>
