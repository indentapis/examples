<<<<<<< HEAD
import { AxiosResponse } from 'axios'
import { Event } from '@indent/types'
import { GaxiosResponse } from 'gaxios'
import { verify } from '@indent/webhook'
import { Request, Response } from 'express'
import * as groups from './capabilities/google-groups'

exports['webhook'] = async function handle(req: IRequest, res: Response) {
  const { headers, rawBody } = req
=======
import { AxiosResponse } from "axios";
import { Event } from "@indent/types";
import { GaxiosResponse } from "gaxios";
import { verify } from "@indent/webhook";
import { Request, Response } from "express";
import * as groups from "./capabilities/google-groups";

exports["webhook"] = async function handle(req: IRequest, res: Response) {
<<<<<<< HEAD
  const { headers, body } = req;
  const rawBody =
    process.env.NODE_ENV === "development" ? body : JSON.stringify(body);
>>>>>>> a32c009 (feat(/webhooks/change/terraform-gcloud-google-groups/src): Add dependencies for new google groups terraform webhook [ID-859])
=======
  const { headers, rawBody } = req;
>>>>>>> 75eea69 (fixed bug by using rawBody from google message response instead of regular body)

  try {
    await verify({
      secret: process.env.INDENT_WEBHOOK_SECRET,
<<<<<<< HEAD
<<<<<<< HEAD
      body: rawBody.toString(),
      headers,
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
    console.error(err)
    return res.status(500).json({ status: { message: err.message } })
  }

  let events: Array<Event>

  try {
    let json = JSON.parse(rawBody)

    events = json.events as Event[]
  } catch (err) {
    console.error('JSON.parse(body): failed')
    console.error(err)
    return res.status(500).json({ status: { message: err.message } })
  }

  console.log(`@indent/webhook: received ${events.length} events`)
  console.log(JSON.stringify(events, null, 2))

  try {
    await Promise.all(
      events.map((auditEvent: Event): Promise<
        void | GaxiosResponse<any> | AxiosResponse<any> | Status
      > => {
        let { actor, event, resources } = auditEvent

        console.log(
          `@indent/webhook: ${event} { actor: ${
            actor.id
          }, resources: ${JSON.stringify(resources.map((r) => r.id))} }`
        )

        switch (event) {
          case 'access/grant':
            return grantPermission(auditEvent)
          case 'access/revoke':
            return revokePermission(auditEvent)
          default:
            console.log('received unknown event')
            console.log(auditEvent)
            return Promise.resolve()
        }
      })
    )
  } catch (err) {
    if (err.response) {
      let res = err.response

      if (res.body && res.body.toJSON) {
        console.error(JSON.stringify(res.body.toJSON(), null, 2))
      } else if (res.body) {
        console.error(JSON.stringify(res.body, null, 2))
      } else if (res.data) {
        console.error(JSON.stringify(res.data, null, 2))
      } else {
        console.error(JSON.stringify(res, null, 2))
      }
    } else {
      console.error(err)
    }
  }

  return res.status(200).json({})
}

async function grantPermission(auditEvent: Event) {
  if (groups.matchEvent(auditEvent)) {
    return await groups.grantPermission(auditEvent)
=======
      body: rawBody,
=======
      body: rawBody.toString(),
>>>>>>> 75eea69 (fixed bug by using rawBody from google message response instead of regular body)
      headers,
    });
  } catch (err) {
    console.error("@indent/webhook.verify(): failed");
    console.error(err);
    return res.status(500).json({ status: { message: err.message } });
  }

  let events: Array<Event>;

  try {
    let json = JSON.parse(rawBody);

    events = json.events as Event[];
  } catch (err) {
    console.error("JSON.parse(body): failed");
    console.error(err);
    return res.status(500).json({ status: { message: err.message } });
  }

  console.log(`@indent/webhook: received ${events.length} events`);
  console.log(JSON.stringify(events, null, 2));

  try {
    await Promise.all(
      events.map(
        (
          auditEvent: Event
        ): Promise<
          void | GaxiosResponse<any> | AxiosResponse<any> | Status
        > => {
          let { actor, event, resources } = auditEvent;

          console.log(
            `@indent/webhook: ${event} { actor: ${
              actor.id
            }, resources: ${JSON.stringify(resources.map((r) => r.id))} }`
          );

          switch (event) {
            case "access/grant":
              return grantPermission(auditEvent);
            case "access/revoke":
              return revokePermission(auditEvent);
            default:
              console.log("received unknown event");
              console.log(auditEvent);
              return Promise.resolve();
          }
        }
      )
    );
  } catch (err) {
    if (err.response) {
      let res = err.response;

      if (res.body && res.body.toJSON) {
        console.error(JSON.stringify(res.body.toJSON(), null, 2));
      } else if (res.body) {
        console.error(JSON.stringify(res.body, null, 2));
      } else if (res.data) {
        console.error(JSON.stringify(res.data, null, 2));
      } else {
        console.error(JSON.stringify(res, null, 2));
      }
    } else {
      console.error(err);
    }
  }

  return res.status(200).json({});
};

async function grantPermission(auditEvent: Event) {
  if (groups.matchEvent(auditEvent)) {
    return await groups.grantPermission(auditEvent);
>>>>>>> a32c009 (feat(/webhooks/change/terraform-gcloud-google-groups/src): Add dependencies for new google groups terraform webhook [ID-859])
  }

  return {
    code: 404,
    message:
<<<<<<< HEAD
      'This resource is not supported by the capabilities of this webhook.',
  }
}

async function revokePermission(auditEvent: Event) {
  if (groups.matchEvent(auditEvent)) {
    return await groups.revokePermission(auditEvent)
=======
      "This resource is not supported by the capabilities of this webhook.",
  };
}

async function revokePermission(auditEvent: Event) {
  if (groups.matchEvent(auditEvent)) {
    return await groups.revokePermission(auditEvent);
>>>>>>> a32c009 (feat(/webhooks/change/terraform-gcloud-google-groups/src): Add dependencies for new google groups terraform webhook [ID-859])
  }

  return {
    code: 404,
    message:
<<<<<<< HEAD
      'This resource is not supported by the capabilities of this webhook.',
  }
}

type IRequest = Request & { rawBody: string }

type Status = {
  code: number
  message: string
}
=======
      "This resource is not supported by the capabilities of this webhook.",
  };
}

type IRequest = Request & { rawBody: string };

type Status = {
  code: number;
  message: string;
};
>>>>>>> a32c009 (feat(/webhooks/change/terraform-gcloud-google-groups/src): Add dependencies for new google groups terraform webhook [ID-859])
