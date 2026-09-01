FROM denoland/deno:2.9.1
WORKDIR /app
COPY services/app .
CMD ["deno", "task", "start"]