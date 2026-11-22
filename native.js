// ================= NATIVE APP EXTRAS (Android / iPhone app only) =================
// On the website this file does nothing.
// In the app it adds:
//  - Step sync from Google Health Connect / Apple Health (phone + watches)
//  - Notifications and alarms scheduled in the phone, so they fire when Bloom is closed
(function () {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  const plug = n => (C.Plugins && C.Plugins[n]) || (C.registerPlugin && C.registerPlugin(n));
  const Health = plug('HealthPlugin'), LN = plug('LocalNotifications'), App = plug('App');
  const isIOS = C.getPlatform() === 'ios';
  const healthName = isIOS ? 'Apple Health' : 'Health Connect';
  window.BLOOM_NATIVE = true;

  // ---------- notifications ----------
  let ready = false;
  async function setupNotifications() {
    try {
      let p = await LN.checkPermissions();
      if (p.display !== 'granted') p = await LN.requestPermissions();
      ready = p.display === 'granted';
      if (!isIOS) {
        await LN.createChannel({ id: 'alarms', name: 'Alarms', description: 'Plan alarms', importance: 5, visibility: 1, vibration: true });
        await LN.createChannel({ id: 'bloom', name: 'Fasting updates', description: 'Hourly fast updates and reminders', importance: 4, visibility: 1, vibration: true });
        try { const ex = await LN.checkExactNotificationSetting(); if (ex.exact_alarm !== 'granted') S.needExact = true; } catch (e) {}
      }
    } catch (e) { ready = false; }
    notifState();
  }
  let nid = 1;
  window.notify = (title, body) => { if (ready) LN.schedule({ notifications: [{ id: 900000 + (nid++ % 1000), title, body, channelId: 'bloom' }] }).catch(() => {}); };
  window.notifState = () => {
    $('#notifStatus').innerHTML = ready ? '✅ Notifications are on. They work even when Bloom is closed.' : '❌ Notifications are off. Tap the button to allow them.';
    $('#enableNotifBtn').style.display = ready ? 'none' : '';
    if (S.needExact && ready) $('#notifStatus').innerHTML += '<br><button class="btn ghost" id="exactBtn" style="margin-top:6px">⏰ Allow exact alarms</button>';
    if ($('#exactBtn')) $('#exactBtn').onclick = async () => { try { await LN.changeExactNotificationSetting(); S.needExact = false; save(); } catch (e) {} };
  };
  $('#enableNotifBtn').onclick = setupNotifications;

  // Build everything the phone should fire in the next 2 days
  function plannedNotifications() {
    const out = [], now = Date.now(), until = now + 48 * 3600e3;
    // plan items: today and tomorrow (tomorrow uses the saved plan)
    ensureToday();
    const addPlan = (items, dayOffset, base) => items.forEach((it, i) => {
      if (it.done || !(it.alarm || it.notify)) return;
      const [h, m] = it.time.split(':').map(Number);
      const d = new Date(); d.setDate(d.getDate() + dayOffset); d.setHours(h, m, 0, 0);
      if (d.getTime() <= now + 5000) return;
      out.push({ id: base + i, title: `${it.alarm ? '⏰' : '🔔'} ${it.time}: ${it.title}`, body: it.why || 'Time for this!', schedule: { at: d, allowWhileIdle: true }, channelId: it.alarm ? 'alarms' : 'bloom' });
    });
    addPlan(S.today.items, 0, 2000);
    const tpl = S.templates[S.templateId]; if (tpl) addPlan(tpl.items.map(x => ({ ...x, notify: true })).concat(waterItems()), 1, 2500);
    // workout program: tomorrow's 2 sessions + midnight call-out if today isn't done
    if (S.program?.active && typeof sessionsFor === 'function') {
      const tk = new Date(); tk.setDate(tk.getDate() + 1);
      addPlan(sessionsFor(todayKey(tk)).map(s => ({ time: s.time, title: `🏋️ ${s.slot === 'am' ? 'Workout 1' : 'Workout 2'}: ${s.w.name}`, why: `${s.w.min} min. 2 a day is the deal.`, alarm: true, notify: true })), 1, 2600);
      const t = todayWorkouts();
      if (t && t.done < 2) {
        const evil = S.persona === 'evil', left = 2 - t.done;
        const last = new Date(); last.setHours(22, 30, 0, 0);
        if (last.getTime() > now) out.push({ id: 3200, title: '🏋️ Last chance today', body: evil ? `${left} workout${left > 1 ? 's' : ''} still open. Midnight is coming for you 😈` : `${left} workout${left > 1 ? 's' : ''} left. You can still do it before midnight 💪`, schedule: { at: last, allowWhileIdle: true }, channelId: 'alarms' });
        const mid = new Date(); mid.setDate(mid.getDate() + 1); mid.setHours(0, 5, 0, 0);
        out.push({ id: 3201, title: evil ? '😈 You skipped your workouts' : '🥺 You missed your workouts', body: 'Are you serious about losing weight? Open Bloom and answer.', schedule: { at: mid, allowWhileIdle: true }, channelId: 'alarms' });
      }
    }
    // end of day water check (today if goal not reached, and tomorrow)
    if (S.water?.goal) for (let k = 0; k < 2; k++) {
      const d = new Date(); d.setDate(d.getDate() + k); const [h, m] = (S.water.to || '21:00').split(':').map(Number); d.setHours(h, m + 30, 0, 0);
      if (d.getTime() > now && !(k === 0 && S.waterAsked === todayKey())) out.push({ id: 3100 + k, title: '💧 Water check', body: 'Did you drink anything you didn\'t add today? Open Bloom and add it.', schedule: { at: d, allowWhileIdle: true }, channelId: 'bloom' });
    }
    // fasting: one update every hour
    if (S.fast) {
      const perH = bmr() / 24 * 1.1;
      for (let h = Math.floor(fastHours()) + 1; ; h++) {
        const at = S.fast.start + h * 3600e3; if (at > until) break;
        if (!msgDue(h) && h !== S.fast.goal) continue;
        const s = stageFor(h), kcal = Math.round(h * perH);
        let body = `${hypeFor({ h, kcal, fatG: Math.round(kcal * 0.7 / 9), name: S.profile?.name })}\n${s.fact}`;
        if (h % 4 === 0 || msgEvery() >= 4) body += '\n🩺 Body check time: how do you feel?';
        out.push({ id: 1000 + (h % 900), title: `⏳ Hour ${h}: ${s.name} ${s.emoji}`, body, schedule: { at: new Date(at), allowWhileIdle: true }, channelId: 'bloom' });
        if (h === S.fast.goal) out.push({ id: 1999, title: '🎉 Goal reached!', body: `You completed your ${S.fast.goal}h fast. So proud of you!`, schedule: { at: new Date(at + 60e3), allowWhileIdle: true }, channelId: 'bloom' });
      }
    }
    // daily photo reminder at 9:00 for the next 2 days
    for (let k = 0; k < 2; k++) {
      const d = new Date(); d.setDate(d.getDate() + k); d.setHours(9, 0, 0, 0);
      if (d.getTime() > now && !(k === 0 && S.photoNag === todayKey())) out.push({ id: 3000 + k, title: '📷 Daily photo time', body: 'Quick photo of you and the scale. Future you will love seeing the difference.', schedule: { at: d, allowWhileIdle: true }, channelId: 'bloom' });
    }
    return out;
  }
  let schedTimer;
  async function reschedule() {
    if (!ready) return;
    try {
      const pending = await LN.getPending();
      const ours = pending.notifications.filter(n => n.id < 900000);
      if (ours.length) await LN.cancel({ notifications: ours.map(n => ({ id: n.id })) });
      const list = plannedNotifications();
      if (list.length) await LN.schedule({ notifications: list });
    } catch (e) {}
  }
  // reschedule whenever data is saved (debounced)
  const origSave = window.save;
  window.save = function () { origSave(); clearTimeout(schedTimer); schedTimer = setTimeout(reschedule, 1500); };
  // in-app checks would double up with phone notifications, so turn them off
  window.checkFastHour = () => { if (S.fast) S.fast.lastHour = Math.floor(fastHours()); };
  window.photoReminder = () => {};
  LN.addListener('localNotificationActionPerformed', a => {
    const t = a.notification?.title || '';
    if (t.includes('Body check')) bodyCheck();
  }).catch?.(() => {});

  // ---------- steps from Health Connect / Apple Health ----------
  async function syncSteps(quiet) {
    if (!S.healthOn) return;
    try {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const r = await Health.queryAggregated({ startDate: start.toISOString(), endDate: new Date().toISOString(), dataType: 'steps', bucket: 'day' });
      const steps = Math.round((r.aggregatedData || []).reduce((a, b) => a + (b.value || 0), 0));
      const d = day();
      if (steps > d.steps) { d.steps = steps; origSave(); renderSteps(); renderGlance(); }
      if (!quiet) toast(`👟 Synced ${steps.toLocaleString()} steps from ${healthName}`);
      if (steps >= S.settings.stepGoal && S.goalToast !== todayKey()) { S.goalToast = todayKey(); origSave(); toast('Step goal reached! 🎉'); }
    } catch (e) { if (!quiet) toast(`Couldn't read steps from ${healthName}`); }
  }
  async function connectHealth() {
    try {
      const a = await Health.isHealthAvailable();
      if (!a.available) {
        if (!isIOS) { toast('Install Health Connect first'); try { await Health.showHealthConnectInPlayStore(); } catch (e) {} }
        else toast('Apple Health is not available on this device');
        return;
      }
      await Health.requestHealthPermissions({ permissions: ['READ_STEPS'] });
      S.healthOn = true; origSave(); renderHealthBox(); syncSteps(false);
    } catch (e) { toast(`Couldn't connect to ${healthName}`); }
  }
  function renderHealthBox() {
    let box = $('#healthBox');
    if (!box) {
      box = document.createElement('div'); box.id = 'healthBox'; box.style.marginTop = '10px';
      $('#stepKcal').after(box);
    }
    box.innerHTML = S.healthOn
      ? `<div class="row gap wrap"><span class="chip">✅ Synced with ${healthName}</span><button class="btn ghost" id="healthSync">↻ Sync now</button></div>
         <p class="muted small">Steps from your phone and watch are added automatically, even when Bloom is closed.${isIOS ? '' : ' Watches (Samsung, Fitbit, Garmin, Pixel…) need their app to share steps with Health Connect.'}</p>`
      : `<button class="btn" id="healthConnect">❤️ Connect ${healthName}</button>
         <p class="muted small">Count steps all day from your phone and smartwatch, even when Bloom is closed.</p>`;
    if ($('#healthConnect')) $('#healthConnect').onclick = connectHealth;
    if ($('#healthSync')) $('#healthSync').onclick = () => syncSteps(false);
    // the old "keep Bloom open" step counter isn't needed in the app
    const pedo = $('#pedoBtn'); if (pedo) pedo.style.display = S.healthOn ? 'none' : '';
    const hint = document.querySelector('#view-move .card .muted.small:last-child');
    if (hint && hint.textContent.includes('Right now Bloom counts')) hint.style.display = 'none';
  }

  // ---------- start ----------
  renderHealthBox();
  setupNotifications().then(reschedule);
  syncSteps(true);
  setInterval(() => syncSteps(true), 5 * 60e3);
  App.addListener('appStateChange', s => { if (s.isActive) { syncSteps(true); renderAll(); renderHealthBox(); reschedule(); } });
})();
