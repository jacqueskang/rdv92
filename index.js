const puppeteer = require('puppeteer');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch();

    console.log('Showing booking page...');
    const page = await browser.newPage();
    const response1 = await page.goto('http://www.hauts-de-seine.gouv.fr/booking/create/11776/0');
    if (!response1.ok()) {
        console.log('Page showing error (see screenshot). Exiting');
        await page.screenshot({ path: 'screenshot.png' });
        return;
    }

    console.log('Clicking accept condition checkbox...');
    await page.click('input#condition');

    console.log('Clicking next button and waiting for navigation...');
    const [response2, _] = await Promise.all([
        page.waitForNavigation(),
        page.click('input[name=nextButton]'),
    ]);

    if (!response2.ok()) {
        console.log('Page showing error (see screenshot). Exiting');
        await page.screenshot({ path: 'screenshot.png' });
        return;
    }

    var formText = await page.$eval('form#FormBookingCreate', el => el.innerText);
    console.log('Showing: ' + formText);
    if (formText.search('n\'existe plus de plage') >= 0)
    {
        console.log('No place available. exiting...');
        return;
    }

    console.log('AHHHHHHH');

    await page.screenshot({ path: 'screenshot.png' });
    await browser.close();
})();