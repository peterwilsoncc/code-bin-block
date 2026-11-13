<?php
/**
 * Code Bin
 *
 * @package           CodeBin
 * @author            Peter Wilson
 * @copyright         YYYY Peter Wilson
 * @license           MIT
 *
 * @wordpress-plugin
 * Plugin Name: Code Bin
 * Description: Write HTML, CSS and JavaScript and show it with a live preview.
 * Version: 1.2.0
 * Requires at least: 6.8
 * Requires PHP: 8.0
 * Author: Peter Wilson
 * Author URI: https://peterwilson.cc
 * License: MIT
 * Text Domain: code-bin
 */

namespace CodeBin;

defined( 'ABSPATH' ) || exit;

const PLUGIN_DIRECTORY = __DIR__;
const PLUGIN_FILE      = __FILE__;

require_once __DIR__ . '/inc/namespace.php';

bootstrap();
