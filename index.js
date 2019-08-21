const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

var args = process.argv.slice(2);

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch();

    console.log('Showing booking page...');
    const page = await browser.newPage();
    const response1 = await page.goto('http://www.hauts-de-seine.gouv.fr/booking/create/11776/0');
    if (!response1.ok()) {
        console.log('Page showing error (see screenshot). Exiting...');
        await page.screenshot({ path: 'screenshot.png' });
        browser.close();
        process.exit(-1);
    }

    console.log('Clicking accept condition checkbox...');
    await page.click('input#condition');

    console.log('Clicking next button and waiting for navigation...');
    const [response2, _] = await Promise.all([
        page.waitForNavigation(),
        page.click('input[name=nextButton]'),
    ]);

    if (!response2.ok()) {
        console.log('Page showing error (see screenshot). Exiting...');
        await page.screenshot({ path: 'screenshot.png' });
        browser.close();
        process.exit(-1);
    }

    await page.screenshot({ path: 'screenshot.png' });
    var formText = await page.$eval('form#FormBookingCreate', el => el.innerText);
    console.log('"' + formText + '"');
    if (formText.search('n\'existe plus de plage') >= 0) {
        console.log('No place available. exiting...');
        browser.close();
        process.exit(-1);
    }

    console.log('PLACE DISPONIBLE!!! Sending email...');
    var transporter = nodemailer.createTransport({
        host: 'email-smtp.eu-west-1.amazonaws.com',
        port: 587,
        secure: false,
        auth: {
            user: 'AKIA5PXSB3J4ZUBJNISC',
            pass: args[0]
        }
    });

    transporter.sendMail({
        from: 'jacques.kang@sweeyoo.com',
        to: 'jacques.kang@sweeyoo.com',
        subject: 'PLACE DISPONIBLE!!!',
        text: 'http://www.hauts-de-seine.gouv.fr/booking/create/11776/0'
    }, function (error, info) {
        if (error) {
            console.log('Error while sending email: ' + error);
            browser.close();
            process.exit(-1);
        } else {
            console.log('Email sent: ' + info.response);
            console.log('Closing browser and exiting...');
            browser.close();
            process.exit(0);
        }
    });
})();