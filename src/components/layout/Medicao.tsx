import Script from 'next/script'

/**
 * Medição de audiência.
 *
 * A Vercel mede sozinha (Analytics e Speed Insights, ligados no layout). Aqui
 * entram os dois que dependem de conta de terceiro: o Google Analytics e o
 * pixel do Meta, que é o que permite saber quais anúncios do Instagram e do
 * Facebook trouxeram gente — sem ele, dinheiro de propaganda entra às cegas.
 *
 * Cada um só é carregado se o código correspondente existir nas variáveis de
 * ambiente. Sem código, nenhum script vai para a página: nada pesa, nada quebra.
 *
 *   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX          (analytics.google.com)
 *   NEXT_PUBLIC_META_PIXEL_ID=000000000000  (business.facebook.com → Gerenciador de Eventos)
 */
export default function Medicao() {
  const ga = process.env.NEXT_PUBLIC_GA_ID
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID

  return (
    <>
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga}');
            `}
          </Script>
        </>
      )}

      {pixel && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixel}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1" width="1" alt="" style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${pixel}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}
    </>
  )
}
