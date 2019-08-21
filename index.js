const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const log4js = require('log4js');
log4js.configure({
    appenders: { cheese: { type: 'file', filename: 'logs.txt' } },
    categories: { default: { appenders: ['cheese'], level: 'error' } }
});

var logger = log4js.getLogger();
logger.level = 'debug';

var args = process.argv.slice(2);

(async () => {
    logger.info('Launching browser...');
    const browser = await puppeteer.launch();

    logger.info('Showing booking page...');
    const page = await browser.newPage();
    const response1 = await page.goto('http://www.hauts-de-seine.gouv.fr/booking/create/11776/0');
    if (!response1.ok()) {
        logger.error('Page showing error (see last-error.png). Exiting...');
        await page.screenshot({ path: 'last-error.png' });
        browser.close();
        process.exit(-1);
    }

    logger.info('Clicking accept condition checkbox...');
    await page.click('input#condition');

    logger.info('Clicking next button and waiting for navigation...');
    const [response2, _] = await Promise.all([
        page.waitForNavigation(),
        page.click('input[name=nextButton]'),
    ]);

    if (!response2.ok()) {
        logger.error('Page showing error (see last-error.png). Exiting...');
        await page.screenshot({ path: 'last-error.png' });
        browser.close();
        process.exit(-1);
    }

    var formText = await page.$eval('form#FormBookingCreate', el => el.innerText);
    logger.info('"' + formText + '"');
    if (formText.search('n\'existe plus de plage') >= 0) {
        logger.info('No place available (see last-unavailable). exiting...');
        await page.screenshot({ path: 'last-unavailable.png' });
        browser.close();
        process.exit(-1);
    }

    logger.info('PLACE DISPONIBLE!!! Sending email...');
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
            logger.error('Error while sending email: ' + error);
            browser.close();
            process.exit(-1);
        } else {
            logger.info('Email sent: ' + info.response);
            logger.info('Closing browser and exiting...');
            browser.close();
            process.exit(0);
        }
    });

    logger.info('Taking screenshot (last-available.png) and exiting...');
    await page.screenshot({ path: 'last-available.png' });
})();