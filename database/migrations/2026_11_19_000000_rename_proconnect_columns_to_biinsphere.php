<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The hub was renamed from ProConnect to Biinsphere (2026-11-19). Existing
     * links keep their data: the columns are renamed, not recreated. A database
     * that already has the new names is left alone.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'proconnect_user_id')) {
            return;
        }
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('proconnect_user_id', 'biinsphere_user_id');
            $table->renameColumn('proconnect_username', 'biinsphere_username');
            $table->renameColumn('proconnect_linked_at', 'biinsphere_linked_at');
        });
        if (Schema::hasIndex('users', 'users_proconnect_user_id_unique')) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameIndex('users_proconnect_user_id_unique', 'users_biinsphere_user_id_unique');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'biinsphere_user_id')) {
            return;
        }
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('biinsphere_user_id', 'proconnect_user_id');
            $table->renameColumn('biinsphere_username', 'proconnect_username');
            $table->renameColumn('biinsphere_linked_at', 'proconnect_linked_at');
        });
        if (Schema::hasIndex('users', 'users_biinsphere_user_id_unique')) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameIndex('users_biinsphere_user_id_unique', 'users_proconnect_user_id_unique');
            });
        }
    }
};
