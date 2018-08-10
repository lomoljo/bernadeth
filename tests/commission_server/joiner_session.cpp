#include "joiner_session.hpp"
#include "utils.hpp"
#include "agent/uris.hpp"
#include "common/logging.hpp"
#include "common/tlv.hpp"

namespace ot {
namespace BorderRouter {

JoinerSession::JoinerSession(uint16_t aInternalServerPort, const char *aPskdAscii)
    : mDtlsServer(Dtls::Server::Create(aInternalServerPort, JoinerSession::HandleSessionChange, this))
    , mCoapAgent(Coap::Agent::Create(JoinerSession::SendCoap, this))
    , mJoinerFinalizeHandler(OT_URI_PATH_JOINER_FINALIZE, HandleJoinerFinalize, this)
    , mNeedAppendKek(false)
{
    mDtlsServer->SetPSK((const uint8_t *)aPskdAscii, strlen(aPskdAscii));
    mDtlsServer->Start();
    mCoapAgent->AddResource(mJoinerFinalizeHandler);
}

void JoinerSession::HandleSessionChange(Dtls::Session &aSession, Dtls::Session::State aState, void *aContext)
{
    JoinerSession *joinerSession = reinterpret_cast<JoinerSession *>(aContext);
    switch (aState)
    {
    case Dtls::Session::kStateReady:
        printf("Session ready\n");
        memcpy(joinerSession->mKek, aSession.GetKek(), sizeof(joinerSession->mKek));
        aSession.SetDataHandler(JoinerSession::FeedCoap, joinerSession);
        joinerSession->mDtlsSession = &aSession;
        break;

    case Dtls::Session::kStateClose:
        break;

    case Dtls::Session::kStateError:
    case Dtls::Session::kStateEnd:
        joinerSession->mDtlsSession = NULL;
        break;
    default:
        break;
    }
}

ssize_t JoinerSession::SendCoap(const uint8_t *aBuffer,
                                uint16_t       aLength,
                                const uint8_t *aIp6,
                                uint16_t       aPort,
                                void *         aContext)
{
    ssize_t        ret           = 0;
    JoinerSession *joinerSession = reinterpret_cast<JoinerSession *>(aContext);

    if (joinerSession->mDtlsSession)
    {
        ret = joinerSession->mDtlsSession->Write(aBuffer, aLength);
    }
    else
    {
        otbrLog(OTBR_LOG_INFO, "SendCoap: error NO SESSION");
        ret = -1;
    }

    (void)aIp6;
    (void)aPort;

    return ret;
}

void JoinerSession::FeedCoap(const uint8_t *aBuffer, uint16_t aLength, void *aContext)
{
    printf("Feed to coap\n");
    JoinerSession *joinerSession = reinterpret_cast<JoinerSession *>(aContext);
    joinerSession->mCoapAgent->Input(aBuffer, aLength, NULL, 1);
}

void JoinerSession::HandleJoinerFinalize(const Coap::Resource &aResource,
                                         const Coap::Message & aRequest,
                                         Coap::Message &       aResponse,
                                         const uint8_t *       aIp6,
                                         uint16_t              aPort,
                                         void *                aContext)
{
    JoinerSession *joinerSession = reinterpret_cast<JoinerSession *>(aContext);
    uint8_t        payload[10];
    Tlv *          responseTlv = reinterpret_cast<Tlv *>(payload);

    printf("HandleJoinerFinalize, STATE = 1\n");
    otbrLog(OTBR_LOG_INFO, "HandleJoinerFinalize, STATE = 1\n");
    joinerSession->mNeedAppendKek = true;

    responseTlv->SetType(Meshcop::kState);
    responseTlv->SetValue(static_cast<uint8_t>(1));
    responseTlv = responseTlv->GetNext();

    // Piggyback response
    aResponse.SetCode(Coap::kCodeChanged);
    aResponse.SetPayload(payload, utils::LengthOf(payload, responseTlv));

    (void)aResource;
    (void)aRequest;
    (void)aIp6;
    (void)aPort;
}

void JoinerSession::Process(const fd_set &aReadFdSet, const fd_set &aWriteFdSet, const fd_set &aErrorFdSet)
{
    mDtlsServer->Process(aReadFdSet, aWriteFdSet, aErrorFdSet);
}

void JoinerSession::UpdateFdSet(fd_set & aReadFdSet,
                                fd_set & aWriteFdSet,
                                fd_set & aErrorFdSet,
                                int &    aMaxFd,
                                timeval &aTimeout)
{
    mDtlsServer->UpdateFdSet(aReadFdSet, aWriteFdSet, aErrorFdSet, aMaxFd, aTimeout);
}

bool JoinerSession::NeedAppendKek() {
    return mNeedAppendKek;
}

void JoinerSession::MarkKekSent() {
    mNeedAppendKek = false;
}

void JoinerSession::GetKek(uint8_t *aBuf, size_t aBufSize) {
    memcpy(aBuf, mKek, utils::min(sizeof(mKek), aBufSize));
}

JoinerSession::~JoinerSession() {
    Dtls::Server::Destroy(mDtlsServer);
    Coap::Agent::Destroy(mCoapAgent);
}

} // namespace BorderRouter
} // namespace ot
