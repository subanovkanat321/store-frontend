import { Link, Outlet } from 'react-router'

import { LogoMark, WhatsappIcon } from '../components/icons'
import { useStorefront } from './useStorefront'

export function Layout() {
  const storefront = useStorefront().data
  const brand = storefront?.brandName ?? 'Магазин'
  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="logo" to="/">
            <span className="logo__mark">
              <LogoMark />
            </span>
            <span className="logo__name">{brand}</span>
          </Link>
          {storefront && (
            <a className="site-header__chat" href={storefront.whatsappUrl} target="_blank" rel="noopener">
              <WhatsappIcon />
              Написать нам
            </a>
          )}
        </div>
      </header>
      <Outlet />
      <footer className="site-footer">
        <div className="site-footer__inner">
          <p className="site-footer__brand">{brand}</p>
          {storefront && <p>{storefront.tagline}</p>}
          <p className="site-footer__links">
            {storefront?.terms && <Link to="/delivery">Доставка и оплата</Link>}
            {storefront && (
              <a href={storefront.whatsappUrl} target="_blank" rel="noopener">
                Вопросы — в WhatsApp
              </a>
            )}
          </p>
        </div>
      </footer>
    </>
  )
}
