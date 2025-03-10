import {ZuploContext, ZuploRequest, AuthZenInboundPolicy, HttpProblems, environment} from "@zuplo/runtime";

const pdps = {
  "Aserto": "https://authzen-gateway-proxy.demo.aserto.com",
  "Axiomatics": "https://pdp.alfa.guide",
  "Cerbos": "https://authzen-proxy-demo.cerbos.dev",
  "HexaOPA": "https://interop.authzen.hexaorchestration.org",
  "OpenFGA": "https://authzen-interop.openfga.dev/stores/01JG9JGS4W0950VN17G8NNAH3C",
  "PingAuthorize": "https://authzen.idpartners.au",
  "PlainID": "https://authzeninteropt.se-plainid.com",
  "Rock Solid Knowledge": "https://authzen.identityserver.com",
  "SGNL": "https://authzen.sgnlapis.cloud",
  "Topaz": "https://authzen-topaz.demo.aserto.com"
}
const { AUTHZEN_PDP_API_KEYS } = environment
const apiKeys = (AUTHZEN_PDP_API_KEYS && JSON.parse(AUTHZEN_PDP_API_KEYS)) ?? {}

export default async function policy(
  request: ZuploRequest,
  context: ZuploContext,
  options: never,
  policyName: string
) {
  const gatewayPdp = request.headers.get("X_AUTHZEN_GATEWAY_PDP")
  if (!gatewayPdp) {
    context.log.error("GATEWAY PDP URL is missing in the request headers.")
    return HttpProblems.forbidden(request, context)
  }
  const pdpUrl = pdps[gatewayPdp]
  if (!pdpUrl) {
    context.log.error("PDP is not in certified PDP list.")
  }

  const apiKey = apiKeys[gatewayPdp]

  let policy = new AuthZenInboundPolicy({
    authorizerHostname: pdpUrl,
    authorizerAuthorizationHeader: apiKey,
    subject: {
      type: "identity",
      id: request.user.sub
    },
    resource: {
      type: "route",
      id: context.route.path,
    },
    action: {
      name: request.method,
    },
  }, policyName)

  return policy.handler(request, context);
}
