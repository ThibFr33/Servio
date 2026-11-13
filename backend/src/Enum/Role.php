<?php

declare(strict_types=1);

namespace App\Enum;

/**
 * Each user has exactly one role. The hierarchy (admin > manager > employee)
 * is declared in config/packages/security.yaml.
 */
enum Role: string
{
    case Employee = 'ROLE_EMPLOYEE';
    case Manager = 'ROLE_MANAGER';
    case Admin = 'ROLE_ADMIN';
}
