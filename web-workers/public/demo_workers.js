this.onmessage = e => {
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function timedCount() {
    for(var i = 0; i < 1000; i++) {
      this.postMessage(i);
      await sleep(1000-i);
    }
  }

  timedCount(); 
}
