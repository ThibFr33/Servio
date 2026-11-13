<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * CSRF protection for the session cookie: a request that changes data must come
 * from the app's own origin. Browsers set the Origin header themselves, and a
 * third-party site cannot forge it.
 *
 * The front and the API share one origin, so the expected value is simply the
 * request's own scheme, host and port.
 */
#[AsEventListener(event: KernelEvents::REQUEST, priority: self::PRIORITY)]
final class OriginCheckSubscriber
{
    public const REJECTED_MESSAGE = 'Requête refusée.';

    // Before the firewall (priority 8), so the login request is protected too.
    private const PRIORITY = 10;

    private const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    public function __invoke(RequestEvent $event): void
    {
        $request = $event->getRequest();

        if (!$event->isMainRequest() || !$this->isProtected($request)) {
            return;
        }

        if ($this->requestOrigin($request) !== $request->getSchemeAndHttpHost()) {
            $event->setResponse(new JsonResponse(['error' => self::REJECTED_MESSAGE], Response::HTTP_FORBIDDEN));
        }
    }

    private function isProtected(Request $request): bool
    {
        return !\in_array($request->getMethod(), self::SAFE_METHODS, true)
            && str_starts_with($request->getPathInfo(), '/api');
    }

    /**
     * The Origin header, or the origin part of the Referer when a browser omits Origin.
     */
    private function requestOrigin(Request $request): ?string
    {
        $origin = $request->headers->get('Origin');
        if (null !== $origin) {
            return $origin;
        }

        $referer = $request->headers->get('Referer');
        if (null === $referer) {
            return null;
        }

        $parts = parse_url($referer);
        if (!isset($parts['scheme'], $parts['host'])) {
            return null;
        }

        return $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');
    }
}
