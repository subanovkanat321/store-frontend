# store-frontend

Витрина и админка интернет-магазина на React. Бэкенд — [subanovkanat321/store](https://github.com/subanovkanat321/store) (REST API `/api/v1`, ADR 0004).

## Стек и почему он

| Что | Зачем |
|---|---|
| **Vite** | Сборка и dev-сервер: страница обновляется за доли секунды после правки. Прокси `/api` и `/media` на бэкенд даёт тот же origin, что на проде: без CORS, cookie работают как есть |
| **React 19 + TypeScript** | Компоненты и строгие типы. `strict` + `noUncheckedIndexedAccess`: `photos[0]` имеет тип `Photo \| undefined`, забыть проверку не получится |
| **React Router 7** | Адреса те же, что у старого сайта (`/p/:slug`, `/o/:code`): ссылки из рекламы не ломаются |
| **TanStack Query** | Данные с сервера: кэш, повторы при сбое сети, состояния «загружается» и «ошибка». Вместо `useEffect` + `useState` в каждом компоненте |
| **openapi-typescript + openapi-fetch** | Типы из контракта бэкенда (`api/openapi.json`): опечатка в пути или поле — ошибка компиляции, а не 404 на проде |
| **Vitest + Testing Library + MSW** | Тесты глазами пользователя: «ввёл телефон, нажал кнопку, увидел ошибку». MSW подменяет сервер на уровне `fetch` |

## Запуск

```bash
npm ci
npm run dev          # http://localhost:5173 — бэкенд должен работать на :8080
```

Бэкенд: в репозитории `store` — `./mvnw spring-boot:run` (Postgres из `compose.yaml` поднимется сам). Если бэкенд на другом адресе: `STORE_BACKEND=http://... npm run dev`.

## Проверки

```bash
npm test             # тесты
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run build        # сборка в dist/
```

CI запускает всё это на каждый PR. Ещё он проверяет, что типы API совпадают с контрактом и что основной JS не больше 150 КБ gzip.

## Контракт API

`api/openapi.json` — копия `docs/api/openapi.json` из репозитория бэкенда, а `src/api/schema.d.ts` — типы по ней. Если API изменился, выполните в этом репозитории:

```bash
npm run api:sync     # если оба репозитория лежат рядом (../store); иначе STORE_REPO=путь npm run api:sync
```

и закоммитьте оба файла. Изменение контракта видно в диффе, а код, который на него не рассчитан, не скомпилируется.

## Как устроено

- `src/api/client.ts` — клиент API. Добавляет CSRF: значение cookie `XSRF-TOKEN` в заголовке `X-XSRF-TOKEN`. Ошибки Problem Details превращает в `ApiError` с ошибками полей.
- `src/storefront/` — каталог, карточка товара, заказ, статус заказа, доставка.
- `src/admin/` — вход (сессия в HttpOnly-cookie), заказы, ручной заказ по коду WhatsApp, товары и фото, отчёт по кампаниям. Это отдельный чанк: он загружается, только когда открыли `/admin`.
- `src/lib/utm.ts` — метки рекламы первого визита отправляются на сервер (`POST /api/v1/visits`). Страницу отдаёт статика, поэтому сами они до сервера не дойдут.
- `src/site.css` — стили старого сайта без изменений, внешний вид тот же.
