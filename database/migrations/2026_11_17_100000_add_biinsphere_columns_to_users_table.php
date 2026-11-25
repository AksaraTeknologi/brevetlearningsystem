<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The Biinsphere account this user connected (Biinsphere AGENTS §14).
     * Only the Biinsphere id, username and when it was linked: the Biinsphere
     * email is never shared. One Biinsphere account per user and the other way
     * round (unique).
     */
    public function up(): void
    {
        // Already there: created by this migration before the rename (as
        // proconnect_*, renamed by ..._rename_proconnect_columns_to_biinsphere)
        // or by an earlier run.
        if (Schema::hasColumn('users', 'biinsphere_user_id') || Schema::hasColumn('users', 'proconnect_user_id')) {
            return;
        }
        Schema::table('users', function (Blueprint $table) {
            $table->string('biinsphere_user_id', 36)->nullable()->unique();
            $table->string('biinsphere_username', 100)->nullable();
            $table->timestamp('biinsphere_linked_at')->nullable();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'biinsphere_user_id')) {
            return;
        }
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['biinsphere_user_id']);
            $table->dropColumn(['biinsphere_user_id', 'biinsphere_username', 'biinsphere_linked_at']);
        });
    }
};
