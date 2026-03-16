# ARVAD: This exact code change was already implemented at Dockerfile:1-51
FROM nginx:alpine

LABEL maintainer="Computer Accessories Store"
LABEL version="1.0.0"
LABEL description="Static landing page for Computer Accessories Store"

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY index.html .
COPY css/ ./css/
COPY js/ ./js/
COPY status.json .

RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '    listen 80;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    index index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Cache-Control "public, max-age=31536000, immutable";' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '    location ~* \.(html)$ {' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Cache-Control "no-cache, must-revalidate";' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '    location = /status.json {' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Cache-Control "no-cache, must-revalidate";' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Content-Type "application/json";' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/status.json || exit 1

STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]
