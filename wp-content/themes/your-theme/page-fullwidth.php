<?php
/**
 * Template Name: Full Width Page
 * Description: A page template with no sidebar and full-width content.
 */

get_header(); ?>

<div class="full-width-container">
    <main id="main" class="site-main" role="main">
        <?php while (have_posts()) : the_post(); ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                <header class="entry-header">
                    <h1 class="entry-title"><?php the_title(); ?></h1>
                </header>

                <div class="entry-content">
                    <?php the_content(); ?>
                </div>
            </article>
        <?php endwhile; ?>
    </main>
</div>

<style>
.full-width-container {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    padding: 0;
}
.full-width-container .entry-content {
    max-width: none;
    padding: 0;
}
</style>

<?php get_footer(); ?>
