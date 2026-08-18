# TODO

phase one full read only program

`cargo run` should luanch a full axum program.

on start up we shuld do "get_number_of_pools" and "get_pools" view call on rhea to get all the latest pool info to keep in state

we should the use intear-events to keep our instate data fresh so we dont have to guess when to do rpc view call, using intear event methods "trade_pool", "trade_pool_change", "trade_swap", and anyother relvant methods.

our program should have to methods for geting resturn, a "get_return" view call to rhea, but also inturnal logic for claulating this becuase we have rhea contratc full sate in memory.

we should also use intear price-indexer primarliy for geting all token metadat so we dont have to use ft_metadata rpc view requests. for price of tokens i would love if we could use our own internal logic based on the state that we have, but if too colicated we can just use intear prices. but for the token datils the decimal places is omportant  to that we can display them in a huma readbale way in our ui.


our in memory state should stay fresh and have the abilyty to dynmicly update as new tokens and pools are created. 

our axum app should be fully typed and have clean state mangagment.

we shpuld have a fullstack web app with backend json only routes after /api/.
for pages this is a full blown dex ui.
so we need a page with swap componet for slecting tokens and inpiting amounts in and out and getting a return
we neeed a page that shows a list of pools.
we also need token pages that shows a list of all the pools a token is in.
and a pool page
and a page or pages for streaming live data form the websocket.
we should also have a profile page at /trader/{account_id}, we should set this just for the view only "HUGGIES_REX_SIGNER_ACCOUNT_ID=frozen_bot2.user.intear.near",

our vault is for savng and creating token watchlish/favoirt list, lists of account ids of other traders we wnat to follow so we can cehck our their profile and how much assest they have.
this is part of phase one, read and write to our vault folder location.



our program should support like for the token inputs, token slecter, and pool page to search for by token name or ca or whatever, and our backend needs to support this as we will not have heave js client side logic, and it needs to be fast backend.


=====================
<br/>
copyright 2026 by sleet.near
