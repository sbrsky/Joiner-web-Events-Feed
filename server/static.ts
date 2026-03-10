import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { getAnalyticsConfig } from "./routes";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Disable default index.html serving to ensure our injection logic is always used
  app.use(express.static(distPath, { index: false }));

  // serve the index.html with injected environment variables for the client
  app.use("/{*path}", async (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send("Not found");
    }

    try {
      let html = await fs.promises.readFile(indexPath, "utf-8");

      // Inject runtime environment variables that the client needs
      const env = {
        VITE_BRANCH_KEY: process.env.VITE_BRANCH_KEY || process.env.BRANCH_KEY,
        VITE_BRANCH_LINK_DOMAIN: process.env.VITE_BRANCH_LINK_DOMAIN || process.env.BRANCH_LINK_DOMAIN,
        VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
        VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
      };

      const envScript = `
        <script>
          window.ENV = ${JSON.stringify(env)};
          console.log('[Joiner] Runtime environment injected:', !!window.ENV?.VITE_BRANCH_KEY ? 'Success' : 'Missing Keys');
        </script>
      `;

      // Build analytics scripts from server-side saved config
      const cfg = getAnalyticsConfig();
      let analyticsScript = "";

      if (cfg.gtm_id) {
        analyticsScript += `<!-- Google Tag Manager --><script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${cfg.gtm_id}');</script><!-- End Google Tag Manager -->`;
      }

      if (cfg.ga_measurement_id && !cfg.gtm_id) {
        analyticsScript += `<!-- Google Analytics 4 --><script async src="https://www.googletagmanager.com/gtag/js?id=${cfg.ga_measurement_id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${cfg.ga_measurement_id}');</script>`;
      }

      if (cfg.meta_pixel_id) {
        analyticsScript += `<!-- Meta Pixel --><script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${cfg.meta_pixel_id}');fbq('track','PageView');</script>`;
      }

      if (cfg.clarity_id) {
        analyticsScript += `<!-- Microsoft Clarity --><script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${cfg.clarity_id}");</script>`;
      }

      if (cfg.hotjar_id) {
        analyticsScript += `<!-- Hotjar --><script>(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${cfg.hotjar_id},hjsv:${cfg.hotjar_sv || 6}};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r)})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');</script>`;
      }

      if (cfg.mixpanel_token) {
        analyticsScript += `<!-- Mixpanel --><script type="text/javascript">(function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;b._i=[];b.init=function(e,f,c){function g(a,d){var b=d.split(".");2==b.length&&(a=a[b[0]],d=b[1]);a[d]=function(){a.push([d].concat(Array.prototype.slice.call(arguments,0)))}}var a=b;"undefined"!==typeof c?a=b[c]=[]:c="mixpanel";a.people=a.people||[];a.toString=function(a){var d="mixpanel";"mixpanel"!==c&&(d+="."+c);a||(d+=" (stub)");return d};a.people.toString=function(){return a.toString(1)+".people (stub)"};i="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_sinks people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");for(h=0;h<i.length;h++)g(a,i[h]);var j="set set_once union unset remove delete".split(" ");a.get_group=function(){function b(c){d[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));a.push(["get_group"].concat(call2))}}for(var d={},c=0;c<j.length;c++)b(j[c]);return d};b._i.push([e,f,c])};b.__SV=1.2;e=f.createElement("script");e.type="text/javascript";e.async=!0;e.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===f.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";g=f.getElementsByTagName("script")[0];g.parentNode.insertBefore(e,g)}})(document,window.mixpanel||[]);mixpanel.init("${cfg.mixpanel_token}",{track_pageview:true});</script>`;
      }

      html = html.replace("</head>", `${envScript}${analyticsScript}</head>`);

      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (e) {
      console.error("Error serving index.html:", e);
      res.status(500).send("Internal Server Error");
    }
  });
}
