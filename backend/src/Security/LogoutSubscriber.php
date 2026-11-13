<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Event\LogoutEvent;

/**
 * The front is a single-page app: answer the logout with an empty response
 * instead of Symfony's default redirect.
 */
#[AsEventListener]
final class LogoutSubscriber
{
    public function __invoke(LogoutEvent $event): void
    {
        $event->setResponse(new Response(null, Response::HTTP_NO_CONTENT));
    }
}
