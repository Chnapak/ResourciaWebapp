FROM postgres:17-alpine

RUN apk add --no-cache rclone curl

COPY backup.sh /backup.sh
COPY crontab /etc/crontabs/root
RUN chmod +x /backup.sh

COPY restore.sh /restore.sh
RUN chmod +x /restore.sh

CMD ["crond", "-f", "-l", "2"]