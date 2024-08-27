<template>
  <canvas class="qrcode-img" ref="qrcode"></canvas>
</template>

<script>
import QRCode from 'qrcode';

export default {
  name: 'QrCode',
  props: {
    url: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 200, // 默认大小为200px
    },
  },
  mounted() {
    this.generateQRCode();
  },
  methods: {
    generateQRCode() {
      const canvas = this.$refs.qrcode;
      QRCode.toCanvas(canvas, this.url, {
        width: this.size,
        height: this.size,
      }, (error) => {
        if (error) console.error(error);
      });
    },
  },
};
</script>

<style scoped>
.qr-code-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
</style>
