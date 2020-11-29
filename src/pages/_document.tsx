import Document, { Head, Html, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head />
        <body>
          {/* Global site tag (gtag.js) - Google Analytics */}
          {/* {process.env.NODE_ENV !== 'production' ? null : (
            <script
              async
              src="https://www.googletagmanager.com/gtag/js?id=G-KEMRWMJM34"
            />
          )}
          {process.env.NODE_ENV !== 'production' ? null : (
            <script
              dangerouslySetInnerHTML={{
                __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-KEMRWMJM34');
          `
              }}
            />
          )} */}
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
