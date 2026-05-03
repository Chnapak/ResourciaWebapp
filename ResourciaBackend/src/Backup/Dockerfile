FROM postgres:17-alpine

RUN apk add --no-cache rclone

COPY backup.sh /backup.sh
COPY crontab /etc/crontabs/root
RUN chmod +x /backup.sh

CMD ["crond", "-f", "-l", "2"]
