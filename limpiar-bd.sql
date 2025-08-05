-- SCRIPT PARA LIMPIAR BASE DE DATOS DE TESTING
-- Ejecutar en tu cliente MySQL/phpMyAdmin

-- 1. LIMPIAR VISITAS ACTIVAS
UPDATE pdv_visits
SET visit_status = 'cancelled',
    updated_at = NOW()
WHERE visit_status = 'in_progress';

-- 2. LIMPIAR JORNADAS LABORALES ACTIVAS
UPDATE working_sessions
SET status = 'ended',
    ended_at = NOW(),
    updated_at = NOW()
WHERE status = 'active';

-- 3. VERIFICAR QUE TODO ESTÉ LIMPIO
SELECT 'VISITAS ACTIVAS:' as check_type, COUNT(*) as count
FROM pdv_visits
WHERE visit_status = 'in_progress'
UNION ALL
SELECT 'JORNADAS ACTIVAS:' as check_type, COUNT(*) as count
FROM working_sessions
WHERE status = 'active';

-- El resultado debe mostrar:
-- VISITAS ACTIVAS: 0
-- JORNADAS ACTIVAS: 0
