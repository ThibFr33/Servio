<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\TooManyLoginAttemptsAuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;

/**
 * Every failed login gets the same message, whatever the reason (unknown email,
 * wrong password, disabled account), so the API never reveals which accounts exist.
 */
final class LoginFailureHandler implements AuthenticationFailureHandlerInterface
{
    public const GENERIC_MESSAGE = 'Identifiants invalides.';
    public const TOO_MANY_ATTEMPTS_MESSAGE = 'Trop de tentatives de connexion. Réessayez dans une minute.';

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        if ($exception instanceof TooManyLoginAttemptsAuthenticationException) {
            return new JsonResponse(['error' => self::TOO_MANY_ATTEMPTS_MESSAGE], Response::HTTP_TOO_MANY_REQUESTS);
        }

        return new JsonResponse(['error' => self::GENERIC_MESSAGE], Response::HTTP_UNAUTHORIZED);
    }
}
