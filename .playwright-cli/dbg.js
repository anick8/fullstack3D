async (page) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1500);
  const go = (p) => page.evaluate((p) => { const s = document.querySelector('section'); window.scrollTo(0, s.offsetTop + (s.offsetHeight - innerHeight) * p); }, p);
  const snap = () => page.evaluate(() => { const t = document.querySelector('.w-max'); const card = t.closest('[inert], .pointer-events-none.absolute.z-10') ; return { y: scrollY, tf: t.style.transform, inert: t.closest('[inert]') !== null, op: t.closest('.z-10.flex')?.style.opacity }; });
  const r = [];
  await go(0.28); await page.waitForTimeout(5000); r.push(await snap());
  await go(0.6); await page.waitForTimeout(5000); r.push(await snap()); await page.waitForTimeout(600); r.push(await snap());
  return r;
}
