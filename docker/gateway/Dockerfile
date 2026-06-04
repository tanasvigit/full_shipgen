FROM nginx:stable-alpine

RUN apk add --no-cache gettext

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY proxy_params.conf /etc/nginx/proxy_params.conf
COPY proxy_service_auth.conf /etc/nginx/proxy_service_auth.conf

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '${GATEWAY_INTERNAL_SECRET}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
