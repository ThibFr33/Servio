<?php

declare(strict_types=1);

namespace App\Tests\Functional\Api;

use Symfony\Bundle\FrameworkBundle\KernelBrowser;

/**
 * Sends API requests like the React app does (JSON-LD, from the app's own origin)
 * and reads the responses. Shared by the API tests.
 */
trait ApiRequestTrait
{
    private KernelBrowser $client;

    /**
     * @param array<string, mixed>|null $payload
     */
    private function send(string $method, string $uri, ?array $payload = null): void
    {
        $server = ['HTTP_ACCEPT' => 'application/ld+json', 'HTTP_ORIGIN' => 'http://localhost'];
        if (null !== $payload) {
            $server['CONTENT_TYPE'] = 'PATCH' === $method ? 'application/merge-patch+json' : 'application/ld+json';
        }

        $this->client->request($method, $uri, server: $server, content: null === $payload ? null : json_encode($payload, \JSON_THROW_ON_ERROR));
    }

    /**
     * @return array<string, mixed>
     */
    private function responseData(): array
    {
        $data = json_decode((string) $this->client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($data);

        return $data;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function members(): array
    {
        $data = $this->responseData();
        $members = $data['member'] ?? $data['hydra:member'] ?? null;
        self::assertIsArray($members);

        return array_values($members);
    }
}
