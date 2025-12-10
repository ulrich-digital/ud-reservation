<?php
/* Datei: admin-columns.php */

defined('ABSPATH') || exit;

/* =====================================================
 * 1) Spalten definieren
 * ===================================================== */
add_filter('manage_ud_reservation_posts_columns', function ($columns) {

    unset($columns['date']);

    return [
        'cb'                       => '<input type="checkbox" />',
        'title'                    => __('Name', 'ud-reservation-ud'),
        'reservation_phone'        => __('Telefonnummer', 'ud-reservation-ud'),
        'reservation_persons'      => __('Personen', 'ud-reservation-ud'),
        'reservation_menu'         => __('Menü-Zusatz', 'ud-reservation-ud'),
        'reservation_present'      => __('Anwesend', 'ud-reservation-ud'),
        'reservation_datetime'     => __('Datum & Uhrzeit', 'ud-reservation-ud'),
        'reservation_suppentag'    => __('Suppentag', 'ud-reservation-ud'),
        'reservation_suppentag_id' => __('Suppentag ID', 'ud-reservation-ud'),
    ];
});

/* =====================================================
 * 2) Spalten-Inhalt
 * ===================================================== */
add_action('manage_ud_reservation_posts_custom_column', function ($column, $post_id) {

    $meta = get_post_meta($post_id);

    switch ($column) {

        case 'reservation_phone':
            echo esc_html($meta['reservation_phone'][0] ?? '–');
            break;

        case 'reservation_persons':
            echo esc_html($meta['reservation_persons'][0] ?? '–');
            break;

        case 'reservation_menu':
            echo esc_html($meta['reservation_menu'][0] ?? '–');
            break;

        case 'reservation_present':
            echo (!empty($meta['reservation_present'][0]) && $meta['reservation_present'][0] == '1') ? '✅' : '❌';
            break;

        case 'reservation_datetime':
            $dt = $meta['reservation_datetime'][0] ?? '';
            echo $dt ? esc_html(date_i18n('d.m.Y H:i', strtotime($dt))) : '–';
            break;

        case 'reservation_suppentag':
            $id = get_post_meta($post_id, 'suppentag_id', true);
            if ($id) {
                printf(
                    '<a href="%s">%s</a>',
                    esc_url(get_edit_post_link($id)),
                    esc_html(get_the_title($id))
                );
            } else {
                echo '–';
            }
            break;

        case 'reservation_suppentag_id':
            echo esc_html(get_post_meta($post_id, 'suppentag_id', true) ?: '–');
            break;
    }
}, 10, 2);

/* =====================================================
 * 3) Sortierbare Spalten
 * ===================================================== */
add_filter('manage_edit-ud_reservation_sortable_columns', function ($cols) {
    $cols['reservation_datetime'] = 'reservation_datetime';
    return $cols;
});

add_action('pre_get_posts', function ($query) {

    if (!is_admin() || !$query->is_main_query()) return;

    if ($query->get('orderby') === 'reservation_datetime') {
        $query->set('meta_key', 'reservation_datetime');
        $query->set('orderby', 'meta_value');
    }

    if (isset($_GET['suppentag_id']) && ($_GET['suppentag_id'] > 0)) {
        $query->set('meta_query', [[
            'key'   => 'suppentag_id',
            'value' => intval($_GET['suppentag_id']),
        ]]);
    }
});

/* =====================================================
 * 4) Filter Dropdown
 * ===================================================== */
add_action('restrict_manage_posts', function ($post_type) {

    if ($post_type !== 'ud_reservation') return;

    $current = intval($_GET['suppentag_id'] ?? 0);

    $suppentage = get_posts([
        'post_type'      => 'ud_suppentag',
        'posts_per_page' => -1,
        'meta_key'       => 'suppentag_date',
        'orderby'        => 'meta_value',
        'order'          => 'DESC',
    ]);

    echo '<select name="suppentag_id" id="filter-by-suppentag" style="max-width:220px;">';
    echo '<option value="">– Alle Suppentage –</option>';

    foreach ($suppentage as $tag) {
        $date = get_post_meta($tag->ID, 'suppentag_date', true);
        $label = get_the_title($tag->ID) . ($date ? ' (' . esc_html($date) . ')' : '');
        printf('<option value="%d" %s>%s</option>',
            $tag->ID,
            selected($current, $tag->ID, false),
            esc_html($label)
        );
    }

    echo '</select>';
});

/* =====================================================
 * 5) QUICK EDIT – Felder anzeigen
 * ===================================================== */
add_action('quick_edit_custom_box', function ($column, $post_type) {

    if ($post_type !== 'ud_reservation') return;
    if ($column !== 'reservation_datetime') return;

    ?>
    <fieldset class="inline-edit-col-full" style="margin-top:1em;border-top:1px solid #ddd;padding-top:1em;">
        <legend style="font-weight:600;margin-bottom:5px;">Reservationdetails</legend>

        <div class="inline-edit-col" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1em;">

            <label><span class="title">Telefonnummer</span>
                <input type="text" name="reservation_phone">
            </label>

            <label><span class="title">Personen</span>
                <input type="number" name="reservation_persons" min="1">
            </label>

            <label><span class="title">Menü-Zusatz</span>
                <input type="text" name="reservation_menu">
            </label>

            <label><span class="title">Datum & Uhrzeit</span>
                <input type="datetime-local" name="reservation_datetime">
            </label>

            <label style="display:flex;align-items:center;gap:6px;">
                <input type="checkbox" name="reservation_present" value="1">
                <span>Anwesend</span>
            </label>

            <label><span class="title">Suppentag ID</span>
                <input type="number" name="suppentag_id" min="0" class="ud-suppentag-id-input">
            </label>

        </div>
    </fieldset>
    <?php
}, 10, 2);

/* =====================================================
 * 6) QUICK EDIT – Werte vorausfüllen
 * ===================================================== */
add_action('admin_footer-edit.php', function () {

    if (get_current_screen()->post_type !== 'ud_reservation') return;

    ?>
    <script>
        jQuery(function ($) {

            $('#the-list').on('click', '.editinline', function () {

                const id = $(this).closest('tr').attr('id').replace('post-', '');
                const row = $(`#post-${id}`);
                const edit = $('#edit-' + id);

                edit.find('[name="reservation_phone"]').val(row.find('.column-reservation_phone').text().trim());
                edit.find('[name="reservation_persons"]').val(row.find('.column-reservation_persons').text().trim());
                edit.find('[name="reservation_menu"]').val(row.find('.column-reservation_menu').text().trim());

                edit.find('[name="reservation_present"]').prop(
                    'checked',
                    row.find('.column-reservation_present').text().includes('✅')
                );

                const dtText = row.find('.column-reservation_datetime').text().trim();
                const match = dtText.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2})/);

                if (match) {
                    edit.find('[name="reservation_datetime"]').val(
                        `${match[3]}-${match[2]}-${match[1]}T${match[4]}`
                    );
                }

                const suppId = row.find('.column-reservation_suppentag_id').text().trim();
                edit.find('[name="suppentag_id"]').val(suppId || "");
            });
        });
    </script>
    <?php
});

/* =====================================================
 * 7) QUICK EDIT – Speichern (mit Sekunden-Fix)
 * ===================================================== */
add_action('save_post_ud_reservation', function ($post_id) {

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    $fields = [
        'reservation_phone',
        'reservation_persons',
        'reservation_menu',
        'reservation_present',
        'reservation_datetime',
        'suppentag_id',
    ];

    foreach ($fields as $field) {

        if (!isset($_POST[$field])) continue;

        $value = sanitize_text_field($_POST[$field]);

        // 🔥 Sekunden-Fix → wandelt "YYYY-MM-DDTHH:MM" nach "YYYY-MM-DDTHH:MM:00"
        if ($field === 'reservation_datetime') {
            if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $value)) {
                $value .= ':00';
            }
        }

        update_post_meta($post_id, $field, $value);
    }
});
