# store-frontend — инструкции для Claude

Фронт интернет-магазина (витрина и админка). Бэкенд — репозиторий `subanovkanat321/store` (Spring Boot, REST API `/api/v1`); архитектура — его `docs/adr/0004-spa-react-rest-api.md`. Владелец — Java-разработчик, учится фронтенду на этом проекте.

## Как работать

- Общение на русском, технические понятия объяснять простыми словами; код пишет Claude, объясняя решения — зачем, почему так и какие были альтернативы.
- Мерж только при зелёном CI (`.github/workflows/ci.yml`).

## Команды

- `npm ci` — зависимости; `npm run dev` — http://localhost:5173 (нужен бэкенд на :8080: `./mvnw spring-boot:run` в `store`)
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`
- `npm run api:sync` — контракт из `../store/docs/api/openapi.json` → `api/openapi.json` и типы `src/api/schema.d.ts`

## Правила кода

- Запросы — только через `src/api/client.ts`: `api` — клиент, типизированный по контракту; `send` — форма входа и multipart. Он добавляет CSRF-заголовок и превращает ошибки Problem Details в `ApiError`.
- Типы ответов не писать руками: `Schemas['...']` из сгенерированного `schema.d.ts`. Поменялся API — `npm run api:sync` в том же PR, что и код под него.
- Цену, сумму и наличие считает сервер; на фронте — только подсказка (итог в форме заказа). Цену в запросах не отправлять.
- Деньги в API — целые сомы (`formatSom`), время — UTC ISO-8601 (`formatDateTime` показывает по Бишкеку).
- Персональные данные (телефон, адрес) не писать в консоль, URL и localStorage.
- Тексты — на русском, как на сайте; ошибки под полями — из `errors[]` ответа 422.
- Тесты — Vitest + Testing Library + MSW (фальшивый бэкенд в `src/test/server.ts`); ответы типизировать схемами контракта.
- Код админки — только в `src/admin`: это отдельный lazy-чанк, покупатель его не скачивает.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. Route only to skills in the session's available-skills list; answer directly for quick questions or small scoped edits.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
