<template>
  <footer class="footer" role="contentinfo">
    <div class="footerInner">
      <p class="copyright">© 2025 사이트명. All rights reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {display:block; width:100%; background:#222222; border-top:1px solid #333333;}
.footerInner {display:flex; align-items:center; width:100%; max-width:1920px; height:80px; padding:0 40px; box-sizing:border-box; margin:0 auto;}
.copyright {font-size:13px; color:#999999;}

@media(max-width:1200px) {
  .footerInner {padding:0 24px;}
}

@media(max-width:768px) {
  .footerInner {height:60px; padding:0 16px;}
  .copyright {font-size:12px;}
}
</style>
