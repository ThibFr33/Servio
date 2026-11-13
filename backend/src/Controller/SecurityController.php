<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Security\LoginFailureHandler;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

final class SecurityController extends AbstractController
{
    /**
     * The json_login authenticator handles the credentials before this method runs.
     * It is only reached on success, or when the request carries no credentials at all.
     */
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(#[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json(['error' => LoginFailureHandler::GENERIC_MESSAGE], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json($user, context: ['groups' => ['user:read']]);
    }

    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(): never
    {
        throw new \LogicException('Intercepted by the logout key of the firewall.');
    }

    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json($user, context: ['groups' => ['user:read']]);
    }
}
