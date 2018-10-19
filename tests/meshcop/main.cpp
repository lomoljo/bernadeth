/*
 *    Copyright (c) 2018, The OpenThread Authors.
 *    All rights reserved.
 *
 *    Redistribution and use in source and binary forms, with or without
 *    modification, are permitted provided that the following conditions are met:
 *    1. Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *    2. Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *    3. Neither the name of the copyright holder nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 *    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *    ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *    SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *    INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *    CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *    ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *    POSSIBILITY OF SUCH DAMAGE.
 */

#include <stdio.h>

#include <arpa/inet.h>

#include "commissioner_proxy.hpp"
#include "tmf_client.hpp"
#include "commissioner/commissioner_constants.hpp"

int main(int argc, char *argv[])
{
    uint16_t                            proxyPort = ot::BorderRouter::kCommissionerProxyPort;
    ot::BorderRouter::CommissionerProxy proxy(proxyPort);
    ot::BorderRouter::TmfClient         client(&proxy);
    struct in6_addr                     addr;
    std::vector<struct in6_addr>        addrList;
    int                                 retval = 1;

    inet_pton(AF_INET6, argv[1], &addr);
    printf("Querying addr %s\n", argv[1]);
    uint32_t *p = (uint32_t *)&addr;
    printf("%08x\n", *p);
    addrList = client.QueryAllV6Addresses(addr);
    printf("Querying addr done\n");
    if (!addrList.empty())
    {
        printf("Got %zu addrs\n", addrList.size());
        retval = 0;
    }
    return retval;

    (void)argc;
}
