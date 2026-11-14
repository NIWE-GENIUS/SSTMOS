'use strict';
const { rawQuery, withTenantContext, shutdown } = require('./db');

(async () => {
    try {
        console.log('Testing database connection...\n');
        const version = await rawQuery('SELECT version() AS v');
        console.log('✅ Connected to:', version.rows[0].v.split(',')[0]);

        const helpers = await rawQuery(`
            SELECT current_school_id() IS NULL AS a,
                   is_platform_admin()         AS b,
                   current_user_id() IS NULL   AS c
        `);
        const h = helpers.rows[0];
        console.log('✅ Helper functions:', '| school null =', h.a, '| admin default =', h.b, '| user null =', h.c);

        const scoped = await withTenantContext(
            { schoolId: '11111111-1111-1111-1111-111111111111', userId: '22222222-2222-2222-2222-222222222222' },
            async (client) => {
                const r = await client.query(`
                    SELECT current_school_id()::text AS s, current_user_id()::text AS u, is_platform_admin() AS a
                `);
                return r.rows[0];
            }
        );
        console.log('✅ withTenantContext:', '| school =', scoped.s, '| user =', scoped.u, '| admin =', scoped.a);

        const admin = await withTenantContext(
            { schoolId: null, userId: null, isPlatformAdmin: true },
            async (client) => (await client.query('SELECT is_platform_admin() AS a')).rows[0]
        );
        console.log('✅ Platform admin context: admin =', admin.a);

        const scopedCount = await withTenantContext(
            { schoolId: '11111111-1111-1111-1111-111111111111', userId: null },
            async (client) => (await client.query('SELECT count(*)::int AS n FROM schools')).rows[0].n
        );
        console.log('✅ RLS smoke test: scoped app sees', scopedCount, 'schools (should be 0)');

        console.log('\n🎉 Database connection layer is working.\n');
        await shutdown();
        process.exit(0);
    } catch (err) {
        console.error('\n❌ db-test failed:');
        console.error(err);
        await shutdown().catch(() => {});
        process.exit(1);
    }
})();