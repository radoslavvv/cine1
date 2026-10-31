using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Migrations.Internal;

namespace CinemaR.Infrastructure.Data.MigrationHistory;

// Npgsql 10 calls this hook before discovering applied migrations, including from EF tooling.
#pragma warning disable EF1001
public sealed class CinemaRHistoryRepository(HistoryRepositoryDependencies dependencies) : NpgsqlHistoryRepository(dependencies)
{
    public override string GetCreateIfNotExistsScript() => """
        DO $history$
        BEGIN
            PERFORM pg_advisory_xact_lock(73190423);
            CREATE SCHEMA IF NOT EXISTS "cinemaR";
            IF to_regclass('catalog.__ef_migrations_history') IS NOT NULL THEN
                IF to_regclass('"cinemaR".__ef_migrations_history') IS NOT NULL THEN
                    RAISE EXCEPTION 'Both legacy and cinemaR migration histories exist; reconcile them before upgrading.';
                END IF;
                ALTER TABLE catalog.__ef_migrations_history SET SCHEMA "cinemaR";
            END IF;
        END $history$;
        """ + Environment.NewLine + base.GetCreateIfNotExistsScript();
}
#pragma warning restore EF1001
