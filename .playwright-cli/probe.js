async (page) => {
  const out = {};
  const go = async (p) => {
    await page.evaluate((p) => {
      const s = document.querySelector('section');
      window.scrollTo(0, s.offsetTop + (s.offsetHeight - innerHeight) * p);
    }, p);
    await page.waitForTimeout(1800);
  };
  const tf = () => page.evaluate(() => {
    const t = document.querySelector('.w-max');
    return t ? getComputedStyle(t).transform : 'none';
  });
  for (const [w, h, name] of [[1440, 900, 'desk'], [390, 844, 'mob']]) {
    await page.setViewportSize({ width: w, height: h });
    await go(0.28);
    const a = await tf(); await page.waitForTimeout(500); const b = await tf();
    out[name + '_moving'] = a !== b;
    out[name + '_overflow'] = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    await page.screenshot({ path: name + '-stack.png' });
    await go(0.6);
    const c = await tf(); await page.waitForTimeout(500); const d = await tf();
    out[name + '_pausedOffscreen'] = c === d;
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload(); await page.waitForTimeout(1500);
  await go(0.28);
  out.reduced_buttons = await page.getByRole('button', { name: /logo carousel/ }).count();
  await page.screenshot({ path: 'desk-reduced.png' });
  return out;
}
