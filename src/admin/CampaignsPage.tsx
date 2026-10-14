import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'

import { api, unwrap } from '../api/client'
import { FormError } from '../components/Field'
import { errorMessage } from '../components/errors'
import { formatSom } from '../lib/format'
import { useTitle } from '../lib/useTitle'

const PERIODS = [
  { days: 7, label: '7 дней' },
  { days: 30, label: '30 дней' },
  { days: 90, label: '90 дней' },
  { days: 0, label: 'Всё время' },
]

export function CampaignsPage() {
  useTitle('Кампании')
  const [params] = useSearchParams()
  const days = PERIODS.find((p) => String(p.days) === params.get('days'))?.days ?? 30
  const report = useQuery({
    queryKey: ['admin', 'campaigns', days],
    queryFn: () => unwrap(api.GET('/api/v1/admin/reports/campaigns', { params: { query: { days } } })),
  })
  const r = report.data

  return (
    <main className="page page--wide">
      <h1>Кампании</h1>
      <nav className="tabs">
        {PERIODS.map((p) => (
          <Link key={p.days} to={`?days=${p.days}`} className={`tabs__tab${p.days === days ? ' tabs__tab--active' : ''}`}>
            {p.label}
          </Link>
        ))}
      </nav>
      <FormError message={errorMessage(report.error)} />
      {r?.rows.length === 0 && <p className="empty">За этот период нет ни кликов, ни заказов.</p>}
      {r && r.rows.length > 0 && (
        <div className="report">
          <table className="report__table">
            <thead>
              <tr>
                <th scope="col">Источник / кампания</th>
                <th scope="col" className="num">Клики WhatsApp</th>
                <th scope="col" className="num">Заказы</th>
                <th scope="col" className="num">с сайта</th>
                <th scope="col" className="num">Подтверждено</th>
                <th scope="col" className="num">Отменено</th>
                <th scope="col" className="num">Выручка</th>
              </tr>
            </thead>
            <tbody>
              {r.rows.map((row) => (
                <tr key={row.label} className={row.source === null && row.campaign === null ? 'report__row--none' : undefined}>
                  <th scope="row">{row.label}</th>
                  <td className="num">{row.clicks}</td>
                  <td className="num">{row.orders}</td>
                  <td className="num">{row.fromSite}</td>
                  <td className={`num${row.enough ? ' report__enough' : ''}`}>
                    {row.confirmed}
                    {row.enough && <span title="Достаточно для вывода"> ✓</span>}
                  </td>
                  <td className="num">{row.cancelled}</td>
                  <td className="num">{formatSom(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Итого</th>
                <td className="num">{r.total.clicks}</td>
                <td className="num">{r.total.orders}</td>
                <td className="num">{r.total.fromSite}</td>
                <td className="num">{r.total.confirmed}</td>
                <td className="num">{r.total.cancelled}</td>
                <td className="num">{formatSom(r.total.revenue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <div className="form__note report__notes">
        <p>
          Кампания — метки <code>utm_source</code> и <code>utm_campaign</code> из ссылки рекламы. Заказ засчитывается
          кампании, с которой покупатель пришёл <b>впервые</b> (за последние 30 дней), даже если заказал позже. Заказ из
          WhatsApp получает кампанию по коду клика из сообщения.
        </p>
        <p>Подтверждено — подтверждённые, отправленные и доставленные. Выручка — сумма подтверждённых заказов.</p>
        {r && <p>✓ — у кампании {r.enoughConfirmed} и больше подтверждённых заказов: по ней уже можно делать вывод.</p>}
      </div>
    </main>
  )
}
