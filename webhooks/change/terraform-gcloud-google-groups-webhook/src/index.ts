import { AxiosResponse } from "axios";
import { Event } from "@indent/types";
import { GaxiosResponse } from "gaxios";
import { verify } from "@indent/webhook";
import { Request, Response } from "express";
import { SetPolicyResponse } from "@google-cloud/storage";
import * as groups from "./capabilities/google-groups";

exports["webhook"] = async function handle(req: IRequest, res: Response) {
  const { headers, body } = req;
  const rawBody =
    process.env.NODE_ENV === "development" ? body : JSON.stringify(body);

  try {
    await verify({
      secret: process.env.INDENT_WEBHOOK_SECRET,
      body: rawBody,
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
          | void
          | GaxiosResponse<any>
          | SetPolicyResponse
          | AxiosResponse<any>
          | Status
        > => {
          let { actor, event, resources } = auditEvent;

          console.log(
            `@indent/webhook: ${event} { actor: ${
              actor.id
            }, resources: ${JSON.stringify(resources.map((r) => r.id))} }`
          );

          switch (event) {
            case "access/grant":
              return grantPermission(auditEvent, events);
            case "access/revoke":
              return revokePermission(auditEvent, events);
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
        console.error(JSON.stringify(res.body.toJSON()));
      } else if (res.body) {
        console.error(JSON.stringify(res.body));
      } else if (res.data) {
        console.error(JSON.stringify(res.data));
      } else {
        console.error(JSON.stringify(res));
      }
    } else {
      console.error(err);
    }
  }

  return res.status(200).json({});
};

async function grantPermission(auditEvent: Event, allEvents: Event[]) {
  if (groups.matchEvent(auditEvent)) {
    return await groups.grantPermission(auditEvent);
  }

  return {
    code: 404,
    message:
      "This resource is not supported by the capabilities of this webhook.",
  };
}

async function revokePermission(auditEvent: Event, allEvents: Event[]) {
  if (groups.matchEvent(auditEvent)) {
    return await groups.revokePermission(auditEvent);
  }

  return {
    code: 404,
    message:
      "This resource is not supported by the capabilities of this webhook.",
  };
}

type IRequest = Request & { rawBody: string };

type Status = {
  code: number;
  message: string;
};
