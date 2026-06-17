<?php

namespace Fleetbase\Mail\Velocity;

use Fleetbase\Mail\Velocity\Exceptions\VelocityTemplateNotFoundException;
use Illuminate\Support\Carbon;

/**
 * Apache Velocity-compatible template engine for PHP email rendering.
 *
 * Supports: $variable, $!variable, ${variable}, property access, #if/#elseif/#else/#end,
 * #foreach, #set, #parse, and ## comments.
 */
class VelocityEngine
{
    /** @var array<string, mixed> */
    protected array $context = [];

    /** @var array<int, string> */
    protected array $templatePaths = [];

    /** @var array<string, string> */
    protected array $templateCache = [];

    public function __construct(array $templatePaths = [])
    {
        $this->templatePaths = $templatePaths;
    }

    public function addTemplatePath(string $path): self
    {
        if (!in_array($path, $this->templatePaths, true)) {
            $this->templatePaths[] = rtrim($path, DIRECTORY_SEPARATOR);
        }

        return $this;
    }

    /**
     * @param array<string, mixed> $context
     */
    public function source(string $template): string
    {
        return $this->loadTemplate($template);
    }

    public function render(string $template, array $context = []): string
    {
        return $this->renderString($this->loadTemplate($template), $context);
    }

    /** @var array<int, string> */
    protected array $rawVariables = [];

    /**
     * @param array<string, mixed> $context
     * @param array<int, string> $rawVariables
     */
    public function renderString(string $source, array $context = [], array $rawVariables = []): string
    {
        $this->context = $context;
        $this->rawVariables = $rawVariables;

        return $this->evaluate($source);
    }

    protected function loadTemplate(string $template): string
    {
        $normalized = ltrim(str_replace('\\', '/', $template), '/');

        if (isset($this->templateCache[$normalized])) {
            return $this->templateCache[$normalized];
        }

        foreach ($this->templatePaths as $root) {
            $path = $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $normalized);
            if (!str_ends_with($path, '.vm')) {
                $path .= '.vm';
            }

            if (is_file($path)) {
                $contents = file_get_contents($path);
                if (str_starts_with($contents, "\xEF\xBB\xBF")) {
                    $contents = substr($contents, 3);
                }
                $this->templateCache[$normalized] = $contents;

                return $this->templateCache[$normalized];
            }
        }

        throw new VelocityTemplateNotFoundException("Velocity template [{$template}] not found.");
    }

    protected function evaluate(string $source): string
    {
        $source = preg_replace('/##.*$/m', '', $source) ?? $source;

        while (preg_match('/#(if|foreach|set|parse)\b/', $source, $matches, PREG_OFFSET_CAPTURE)) {
            $start = $matches[0][1];
            $directive = $matches[1][0];

            if ($directive === 'set') {
                $source = $this->processSetDirective($source, $start);

                continue;
            }

            if ($directive === 'parse') {
                $source = $this->processParseDirective($source, $start);

                continue;
            }

            $block = $this->extractBlock($source, $start);

            if ($block === null) {
                break;
            }

            $replacement = $directive === 'if'
                ? $this->evaluateIfBlock($block['header'], $block['body'])
                : $this->evaluateForeachBlock($block['header'], $block['body']);

            $source = substr($source, 0, $start) . $replacement . substr($source, $block['end']);
        }

        return $this->replaceVariables($source);
    }

    /**
     * @return array{header: string, body: string, end: int}|null
     */
    protected function extractBlock(string $source, int $start): ?array
    {
        if (!preg_match('/#(if|foreach)\s*\((.*?)\)/s', $source, $headerMatch, PREG_OFFSET_CAPTURE, $start)) {
            return null;
        }

        $headerEnd = $headerMatch[0][1] + strlen($headerMatch[0][0]);
        $depth = 1;
        $pos = $headerEnd;
        $length = strlen($source);

        while ($pos < $length && $depth > 0) {
            if (preg_match('/#(if|foreach)\b/', $source, $openMatch, PREG_OFFSET_CAPTURE, $pos)) {
                $openPos = $openMatch[0][1];
                if (preg_match('/#end\b/', $source, $closeMatch, PREG_OFFSET_CAPTURE, $pos)) {
                    $closePos = $closeMatch[0][1];
                    if ($openPos < $closePos) {
                        $depth++;
                        $pos = $openPos + strlen($openMatch[0][0]);

                        continue;
                    }

                    $depth--;
                    if ($depth === 0) {
                        return [
                            'header' => trim($headerMatch[2][0]),
                            'body'   => substr($source, $headerEnd, $closePos - $headerEnd),
                            'end'    => $closePos + strlen($closeMatch[0][0]),
                        ];
                    }

                    $pos = $closePos + strlen($closeMatch[0][0]);

                    continue;
                }
            }

            if (preg_match('/#end\b/', $source, $closeMatch, PREG_OFFSET_CAPTURE, $pos)) {
                $depth--;
                if ($depth === 0) {
                    return [
                        'header' => trim($headerMatch[2][0]),
                        'body'   => substr($source, $headerEnd, $closeMatch[0][1] - $headerEnd),
                        'end'    => $closeMatch[0][1] + strlen($closeMatch[0][0]),
                    ];
                }

                $pos = $closeMatch[0][1] + strlen($closeMatch[0][0]);

                continue;
            }

            break;
        }

        return null;
    }

    protected function evaluateIfBlock(string $condition, string $body): string
    {
        $parts = preg_split('/#elseif\s*\((.*?)\)|#else\b/s', $body, -1, PREG_SPLIT_DELIM_CAPTURE) ?: [];

        if ($this->evaluateCondition($condition)) {
            return $this->evaluate($parts[0] ?? '');
        }

        for ($i = 1; $i < count($parts); $i += 2) {
            $maybeCondition = $parts[$i] ?? null;
            $segment = $parts[$i + 1] ?? '';

            if ($maybeCondition === null) {
                return $this->evaluate($segment);
            }

            if ($this->evaluateCondition($maybeCondition)) {
                return $this->evaluate($segment);
            }
        }

        return '';
    }

    protected function evaluateForeachBlock(string $header, string $body): string
    {
        if (!preg_match('/^\$([a-zA-Z_][\w]*)\s+in\s+(.+)$/', trim($header), $matches)) {
            return '';
        }

        $itemKey = $matches[1];
        $list = $this->resolveExpression(trim($matches[2]));

        if (!is_iterable($list)) {
            return '';
        }

        $output = '';

        foreach ($list as $item) {
            $previous = $this->context[$itemKey] ?? null;
            $this->context[$itemKey] = $item;
            $output .= $this->evaluate($body);
            if ($previous === null) {
                unset($this->context[$itemKey]);
            } else {
                $this->context[$itemKey] = $previous;
            }
        }

        return $output;
    }

    protected function processSetDirective(string $source, int $start): string
    {
        if (!preg_match('/#set\s*\(\s*\$([a-zA-Z_][\w]*)\s*=\s*(.*?)\s*\)/s', $source, $matches, 0, $start)) {
            return $source;
        }

        $this->context[$matches[1]] = $this->resolveExpression(trim($matches[2]));
        $end = $start + strlen($matches[0]);

        return substr($source, 0, $start) . substr($source, $end);
    }

    protected function processParseDirective(string $source, int $start): string
    {
        if (!preg_match('/#parse\s*\(\s*[\'"](.+?)[\'"]\s*\)/', $source, $matches, 0, $start)) {
            return $source;
        }

        $parsed = $this->render($matches[1], $this->context);
        $end = $start + strlen($matches[0]);

        return substr($source, 0, $start) . $parsed . substr($source, $end);
    }

    protected function evaluateCondition(string $condition): bool
    {
        $condition = trim($condition);

        if ($condition === '') {
            return false;
        }

        if (str_contains($condition, '&&')) {
            foreach (array_map('trim', explode('&&', $condition)) as $part) {
                if (!$this->evaluateCondition($part)) {
                    return false;
                }
            }

            return true;
        }

        if (str_contains($condition, '||')) {
            foreach (array_map('trim', explode('||', $condition)) as $part) {
                if ($this->evaluateCondition($part)) {
                    return true;
                }
            }

            return false;
        }

        if (preg_match('/^!(.+)$/', $condition, $matches)) {
            return !$this->evaluateCondition($matches[1]);
        }

        foreach (['==', '!='] as $operator) {
            if (str_contains($condition, $operator)) {
                [$left, $right] = array_map('trim', explode($operator, $condition, 2));

                return $operator === '=='
                    ? (string) $this->resolveExpression($left) === (string) $this->resolveExpression($right)
                    : (string) $this->resolveExpression($left) !== (string) $this->resolveExpression($right);
            }
        }

        $value = $this->resolveExpression($condition);

        return match (true) {
            is_bool($value) => $value,
            is_numeric($value) => (float) $value !== 0.0,
            is_string($value) => $value !== '',
            is_countable($value) => count($value) > 0,
            default => $value !== null,
        };
    }

    protected function resolveExpression(string $expression): mixed
    {
        $expression = trim($expression);

        if ($expression === 'true') {
            return true;
        }

        if ($expression === 'false') {
            return false;
        }

        if ($expression === 'null') {
            return null;
        }

        if (preg_match('/^[\'"](.*)[\'"]$/s', $expression, $matches)) {
            return $matches[1];
        }

        if (str_starts_with($expression, '$')) {
            return $this->resolveReference(substr($expression, 1));
        }

        return $expression;
    }

    protected function resolveReference(string $reference): mixed
    {
        $segments = explode('.', $reference);
        $root = array_shift($segments);
        $value = $this->context[$root] ?? null;

        foreach ($segments as $segment) {
            if ($value === null) {
                return null;
            }

            if (is_array($value)) {
                $value = $value[$segment] ?? null;

                continue;
            }

            if (is_object($value)) {
                if ($value instanceof Carbon) {
                    return $value->format('Y-m-d H:i:s');
                }

                if (method_exists($value, $segment)) {
                    $value = $value->{$segment}();

                    continue;
                }

                $value = $value->{$segment} ?? null;
            }
        }

        return $value;
    }

    protected function replaceVariables(string $source): string
    {
        return preg_replace_callback(
            '/(\$!|\$)\{?([a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)*)\}?/',
            function (array $matches) {
                $quiet = $matches[1] === '$!';
                $value = $this->resolveReference($matches[2]);

                if ($value === null || $value === '') {
                    return $quiet ? '' : '';
                }

                if (is_bool($value)) {
                    return $value ? 'true' : 'false';
                }

                if (is_scalar($value)) {
                    $root = explode('.', $matches[2])[0];
                    // Pre-rendered HTML slot used by email layouts.
                    if (in_array($root, $this->rawVariables, true) || $root === 'bodyContent') {
                        return (string) $value;
                    }

                    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                }

                if ($value instanceof Carbon) {
                    return htmlspecialchars($value->format('Y-m-d H:i:s'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                }

                return htmlspecialchars(json_encode($value) ?: '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            },
            $source
        ) ?? $source;
    }
}
