export function formatPassUpForCopy(passUp) {
    const date = new Date(passUp.date).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  
    const priceInfo = passUp.tickerPrice ? ` $${passUp.tickerPrice}` : '';
    const changeInfo = passUp.tickerPrice ? ' (+XX%)' : ''; // You can calculate this if you store previous price
  
    const rebuttalsHandled = [];
    const rebuttalLabels = {
      whereCallingFrom: 'Where calling from',
      whatCompany: 'What company',
      phoneNumber: 'Phone number',
      firmLocation: 'Firm location',
      whyProviding: 'Why providing info',
      howMakeMoney: 'How make money'
    };
  
    if (passUp.rebuttals && typeof passUp.rebuttals === 'object') {
      Object.entries(passUp.rebuttals).forEach(([key, value]) => {
        if (value === true) {
          rebuttalsHandled.push(rebuttalLabels[key] || key);
        }
      });
    }
  
    let text = `PASS-UP | ${date}
  
  TICKER ${passUp.ticker}${priceInfo}
  NAME: ${passUp.leadName}
  Interested In: ${passUp.interestedIn}
  SMS: ${passUp.agreedToSMS ? 'Yes' : 'No'}
  Disposition: ${passUp.disposition}`;
  
    if (rebuttalsHandled.length > 0) {
      text += `\n\n  Rebuttals Handled:
${rebuttalsHandled.map(r => `  - ${r}`).join('\n')}`;
    }
  
    if (passUp.notes) {
      text += `\n\n  Notes: ${passUp.notes}`;
    }
  
    return text;
  }