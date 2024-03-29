const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");
const utils = require("../../controllers/utils");

// получение всех клиентов пользователя
router.get("/", utils.isTokenValid, (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    prisma.clients.findMany({ skip: limit * (page - 1), take: limit })
        .then(result => {

            for (const index in result) {
                result[index].mobile = result[index]?.mobile.split(";")
                result[index].mail = result[index]?.mail.split(";")
            }

            const total = await prisma.clients.count();

            res.json({
                status: "OK", message: {
                    items: result,
                    paginations: {
                        total: total,
                        last_page: total <= limit ? 1 : total / limit
                    }
                }
            });
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

// добавление клиента
router.post("/add", utils.isTokenValid, (req, res) => {
    const { name, mobile, mail } = req.body;

    if (name.length < 3) return res.json({ status: "error", message: "incorrect name" });

    let mobiles = "";
    for (const index in mobile) {
        if (mobile[index].length !== 10) {
            return res.json({ status: "error", message: "incorrect phone" });
        }
        mobiles += mobile[index] + ";"
    }

    let mails = "";
    for (const index in mail) mails += mail[index] + ";"

    // отправка запроса
    prisma.clients.create({ data: { id_user: req.token.id, ...req.body } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение клиента по айди
router.get("/:id", utils.isTokenValid, (req, res) => {
    // отправка запроса
    prisma.clients.findUnique({ where: { id: req.params.id } })
        .then((result) => {
            if (!result) return res.json({ status: "error", message: "Unknow id" });

            // проверка на пренадлежность клиента к пользователю
            if (result.id_user !== req.token.id) {
                return res.json({ status: "error", message: "Action not allowed" });
            }

            result.mobile = result?.mobile.split(";")
            result.mail = result?.mail.split(";")

            res.json({ status: "OK", message: result });
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

// редактирование клиента
router.post("/:id/edit", utils.isTokenValid, (req, res) => {
    const { name, mobile, mail } = req.body;

    if (name.length < 3) return res.json({ status: "error", message: "incorrect name" });

    let mobiles = "";
    for (const index in mobile) {
        if (mobile[index].length !== 10) {
            return res.json({ status: "error", message: "incorrect phone" });
        }
        mobiles += mobile[index] + ";"
    }

    let mails = "";
    for (const index in mail) mails += mail[index] + ";";

    // отправка запроса
    prisma.clients.update({ data: { ...req.body }, where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление клиента
router.post("/:id/remove", utils.isTokenValid, (req, res) => {
    prisma.clients.delete({ where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

module.exports = router;
