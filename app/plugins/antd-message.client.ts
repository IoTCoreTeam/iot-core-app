import { message } from "ant-design-vue";

export default defineNuxtPlugin(() => {
  message.config({
    getContainer: () => document.body,
  });
});
